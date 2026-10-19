// Local-only same-origin proxy for Expo Web. Avoids changing Auth Service CORS policy.
// Browser -> :8090 -> Expo Metro :8081 or approved staging backend.
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

const bind = process.env.DUTYLOG_DEV_BIND || '127.0.0.1';
const port = Number(process.env.DUTYLOG_DEV_PORT || 8090);
const metroHost = '127.0.0.1';
const metroPort = Number(process.env.EXPO_WEB_PORT || 8081);
const upstream = [
  ['/dutylogapiv1', process.env.DUTYLOG_UPSTREAM],
  ['/apiv1', process.env.DUTYLOG_AUTH_UPSTREAM],
];
if (upstream.some(([, value]) => !value)) {
  console.error('Set DUTYLOG_UPSTREAM and DUTYLOG_AUTH_UPSTREAM to APPROVED staging URLs.');
  process.exit(1);
}
function proxy(req, res) {
  const prefix = upstream.find(([route]) => req.url === route || req.url.startsWith(route + '/'));
  const raw = prefix ? prefix[1] + req.url.slice(prefix[0].length) : `http://${metroHost}:${metroPort}${req.url}`;
  let dest;
  try { dest = new URL(raw); } catch { res.writeHead(502); res.end('Invalid upstream'); return; }
  const agent = dest.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: dest.host };
  delete headers.origin;
  delete headers.referer;
  const forward = agent.request(dest, { method: req.method, headers, timeout: 20000 }, response => {
    const responseHeaders = { ...response.headers };
    if (!prefix) {
      responseHeaders['cross-origin-opener-policy'] = 'same-origin-allow-popups';
      responseHeaders['referrer-policy'] = 'no-referrer-when-downgrade';
    }
    res.writeHead(response.statusCode || 502, responseHeaders);
    response.pipe(res);
  });
  forward.on('timeout', () => forward.destroy(new Error('Upstream timeout')));
  forward.on('error', err => { if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' }); res.end('Dev proxy upstream unavailable: ' + err.message); });
  req.pipe(forward);
}
const server = http.createServer(proxy);
server.on('upgrade', (req, socket, head) => {
  // HMR/WebSocket connections are only forwarded to Metro, never to the APIs.
  if (req.url.startsWith('/dutylogapiv1') || req.url.startsWith('/apiv1')) { socket.destroy(); return; }
  const target = net.connect(metroPort, metroHost, () => {
    target.write(`${req.method} ${req.url} HTTP/1.1\r\n` + Object.entries(req.headers).map(([key, val]) => `${key}: ${val}`).join('\r\n') + '\r\n\r\n');
    if (head.length) target.write(head);
    socket.pipe(target).pipe(socket);
  });
  target.on('error', () => socket.destroy());
  socket.on('error', () => target.destroy());
});
server.listen(port, bind, () => console.log(`DutyLog Expo Web: http://localhost:${port} (Metro :${metroPort}; API via configured upstream)`));
