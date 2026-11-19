import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

// Build real React Native screens with demo-only API/camera adapters into static assets.
const root = fileURLToPath(new URL('../', import.meta.url));
const demo = path.join(root, 'mobile/demo');
const output = path.resolve(root, '../frontend/public/dutylog-demo');
const staging = path.join(os.tmpdir(), `dutylog-demo-export-${process.pid}`);
const result = spawnSync(path.join(root, 'mobile/node_modules/.bin/expo'), ['export', '--platform', 'web', '--max-workers', '2', '--output-dir', staging], {
  cwd: demo, stdio: 'inherit', env: { ...process.env, EXPO_NO_TELEMETRY: '1', CI: '1' },
});
if (result.status !== 0) process.exit(result.status || 1);
const html = (await readFile(path.join(staging, 'index.html'), 'utf8'))
  .replace('<html lang="en">', '<html lang="vi">')
  .replace('<meta charset="utf-8" />', '<meta charset="utf-8" /><meta name="robots" content="noindex" /><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'none\'; font-src \'self\' data:; object-src \'none\'; base-uri \'none\'" />');
await writeFile(path.join(staging, 'index.html'), html);
await mkdir(output, { recursive: true });
// Only replace this script's generated artifact directory after a successful export.
await rm(output, { recursive: true, force: true });
await cp(staging, output, { recursive: true });
const sources = ['mobile/src/screens', 'mobile/src/components', 'mobile/src/ui', 'mobile/demo'];
async function fingerprint(directory) {
  const files = await readdir(path.join(root, directory), { withFileTypes: true });
  const entries = [];
  for (const item of files.sort((a, b) => a.name.localeCompare(b.name))) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    const relative = `${directory}/${item.name}`;
    if (item.isDirectory()) entries.push(...await fingerprint(relative));
    else entries.push({ file: relative, sha256: createHash('sha256').update(await readFile(path.join(root, relative))).digest('hex') });
  }
  return entries;
}
await writeFile(path.join(output, 'sources.json'), JSON.stringify({ description: 'Built from DutyLog React Native screens with isolated synthetic API and camera adapters.', command: 'node dutylog/scripts/build-product-demo.mjs', sources: (await Promise.all(sources.map(fingerprint))).flat() }, null, 2) + '\n');
await rm(staging, { recursive: true, force: true });
console.log(`DutyLog product demo ready: ${output}`);
