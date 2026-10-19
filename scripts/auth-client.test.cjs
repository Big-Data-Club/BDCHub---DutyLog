const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('../mobile/node_modules/typescript');

const source = ts.transpileModule(readFileSync(resolve(__dirname, '../mobile/src/api/client.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const fixture = { userId: 42, email: 'member@example.test', name: 'Test Member', role: 'ROLE_USER', token: 'server-access', refreshToken: 'server-refresh' };
function client(fetch, os = 'web', values = new Map()) {
  const exports = {};
  vm.runInNewContext(source, {
    exports, process: { env: { EXPO_PUBLIC_AUTH_URL: 'https://auth.example.test' } }, fetch,
    console: { warn() {} },
    require: name => {
      if (name === 'react-native') return { Platform: { OS: os } };
      if (name === 'expo-secure-store') return {
        getItemAsync: async key => { assert.notEqual(os, 'web'); return values.get(key) ?? null; },
        setItemAsync: async (key, value) => { assert.notEqual(os, 'web'); values.set(key, value); },
        deleteItemAsync: async key => { assert.notEqual(os, 'web'); values.delete(key); },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

test('Google exchanges the ID token for the Auth session and refreshes in web memory', async () => {
  const calls = [];
  const api = client(async (url, init) => {
    calls.push({ url, init });
    return response(200, url.endsWith('/refresh') ? { token: 'rotated-access', refreshToken: 'rotated-refresh' } : fixture);
  });
  const user = await api.loginWithGoogle('google-id-token');
  assert.equal(user.id, 42);
  assert.equal(user.token, 'server-access');
  assert.equal(user.is_super_admin, false);
  assert.equal(calls[0].url, 'https://auth.example.test/api/auth/google/login');
  assert.deepEqual(JSON.parse(calls[0].init.body), { idToken: 'google-id-token' });
  assert.equal(calls[0].init.credentials, 'omit');
  assert.equal(await api.refreshAccessToken(), true);
  assert.equal(api.getAuthToken(), 'rotated-access');
  assert.deepEqual(JSON.parse(calls[1].init.body), { refreshToken: 'server-refresh' });
  await api.clearSession();
  assert.equal(api.getAuthToken(), '');
  assert.equal(await api.refreshAccessToken(), false);
});

for (const [status, body, message] of [
  [401, { message: 'Invalid Google ID token' }, /Invalid Google/],
  [403, { message: 'Tài khoản đang chờ admin duyệt.' }, /chờ admin/],
  [404, { email: 'member@example.test' }, /chưa có trên BDC Hub/],
  [502, {}, /HTTP 502/],
  [200, { email: 'member@example.test', userId: 42 }, /không hợp lệ/],
]) {
  test(`Google rejects failed or incomplete Auth response (${status})`, async () => {
    const api = client(async () => response(status, body));
    await assert.rejects(api.loginWithGoogle('google-id-token'), message);
    assert.equal(api.getAuthToken(), '');
    assert.equal(api.getCurrentUser(), null);
  });
}

test('network failure never creates a demo login for either login method', async () => {
  const api = client(async () => { throw new Error('offline'); });
  await assert.rejects(api.loginWithGoogle('id-token'), /Không kết nối/);
  await assert.rejects(api.loginWithCredentials('admin@example.test', 'invalid'), /Không kết nối/);
  assert.equal(api.getAuthToken(), '');
});

test('ordinary admin does not gain super-admin UI privileges', async () => {
  const api = client(async () => response(200, { ...fixture, role: 'ROLE_ADMIN' }));
  assert.equal((await api.loginWithGoogle('id-token')).is_super_admin, false);
});

test('expired native refresh cannot restore a fabricated offline session', async () => {
  const values = new Map([
    ['bdchub_dutylog_refresh_token', 'expired-refresh'],
    ['bdchub_dutylog_user_meta', JSON.stringify(fixture)],
  ]);
  const api = client(async () => response(401, {}), 'ios', values);
  assert.equal(await api.restoreSession(), null);
  assert.equal(api.getAuthToken(), '');
});

test('empty Google credential never calls the server', async () => {
  const api = client(async () => { assert.fail('No request expected'); });
  await assert.rejects(api.loginWithGoogle(''), /ID token/);
});

test('new session without refresh token cannot reuse the previous account refresh', async () => {
  let count = 0;
  const api = client(async () => response(200, ++count === 1 ? fixture : { ...fixture, refreshToken: undefined }));
  await api.loginWithGoogle('first-id-token');
  await api.loginWithGoogle('second-id-token');
  assert.equal(await api.refreshAccessToken(), false);
  assert.equal(count, 2);
});

test('native session without metadata cannot invent a user identity', async () => {
  const values = new Map([['bdchub_dutylog_refresh_token', 'refresh']]);
  const api = client(async () => response(200, { token: 'access' }), 'ios', values);
  assert.equal(await api.restoreSession(), null);
  assert.equal(api.getAuthToken(), '');
});
