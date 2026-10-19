import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scripts = dirname(fileURLToPath(import.meta.url));
const mobile = resolve(process.argv[2] || resolve(scripts, '../mobile'));
if (!process.loadEnvFile) throw new Error('Use Node.js 22 or newer.');
// Shell variables win; local overrides win over the shared .env file.
for (const name of ['.env.local', '.env']) {
  const path = resolve(mobile, name);
  if (existsSync(path)) process.loadEnvFile(path);
}
const api = process.env.DUTYLOG_UPSTREAM || process.env.EXPO_PUBLIC_API_URL;
const auth = process.env.DUTYLOG_AUTH_UPSTREAM || process.env.EXPO_PUBLIC_AUTH_URL;
if (!api || !auth) throw new Error('Configure EXPO_PUBLIC_API_URL and EXPO_PUBLIC_AUTH_URL in mobile/.env (see README).');
const port = Number(process.env.DUTYLOG_DEV_PORT || 8090);
const metroPort = Number(process.env.EXPO_WEB_PORT || 8081);
for (const value of [port, metroPort]) {
  if (!Number.isInteger(value) || value < 1024 || value > 65535) throw new Error('Invalid development port.');
}
if (port === metroPort) throw new Error('Proxy and Metro ports must differ.');
for (const value of [api, auth]) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Upstreams must be HTTP(S) API base URLs without credentials, query or fragment.');
  }
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && [port, metroPort].includes(Number(url.port))) {
    throw new Error('An upstream points back to the local proxy/Metro. Configure the remote API URL.');
  }
}
// Fail before starting either child if a port is already occupied.
for (const value of [port, metroPort]) {
  await new Promise((accept, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(value, '127.0.0.1', () => server.close(accept));
  });
}
const env = {
  ...process.env,
  DUTYLOG_UPSTREAM: api.replace(/\/+$/, ''),
  DUTYLOG_AUTH_UPSTREAM: auth.replace(/\/+$/, ''),
  EXPO_PUBLIC_API_URL: `http://localhost:${port}/dutylogapiv1`,
  EXPO_PUBLIC_AUTH_URL: `http://localhost:${port}/apiv1`,
  // The proxy URL is the entry point; do not open Metro's own origin.
  BROWSER: 'none',
};
console.log(`Open http://localhost:${port} — DutyLog UI local, APIs remote.`);
if (!env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) console.log('Google login needs EXPO_PUBLIC_GOOGLE_CLIENT_ID in mobile/.env.');
const children = [];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  const timer = setTimeout(() => { for (const child of children) child.kill('SIGKILL'); }, 3000);
  timer.unref();
}
for (const [file, args] of [
  [resolve(scripts, 'dev-web-proxy.mjs'), []],
  [resolve(mobile, 'node_modules/expo/bin/cli'), ['start', '--web', '--localhost', '--port', String(metroPort), '--clear']],
]) {
  const child = spawn(process.execPath, [file, ...args], { cwd: mobile, env, stdio: 'inherit' });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => stop(code ?? 1));
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
