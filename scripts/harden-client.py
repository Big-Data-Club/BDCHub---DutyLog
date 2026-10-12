#!/usr/bin/env python3
"""Targeted fail-closed transformation of the public DutyLog mobile API client.

Validates exact named exports and aborts on unknown versions. This preserves
function names, input shapes and successful response contracts.
"""
from pathlib import Path
import re
import sys

p=Path(sys.argv[1]); text=p.read_text()
marker='// DutyLog fail-closed API hardening v2'
if marker in text:
    print('client.ts already patched')
    raise SystemExit(0)
assert "import * as SecureStore from \"expo-secure-store\";" in text, 'Unexpected client.ts version'
text=text.replace('import * as SecureStore from "expo-secure-store";', 'import * as SecureStore from "../platform/sessionStore";\n'+marker)

patches={
'restoreSession':'''export async function restoreSession(): Promise<User | null> {
  try {
    const storedRt = await SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY);
    if (!storedRt || !await refreshAccessToken() || !inMemoryAccessToken) return null;
    const raw = await SecureStore.getItemAsync(SECURE_USER_META_KEY);
    if (!raw) return null;
    const meta = JSON.parse(raw);
    if (!meta.id || !meta.email) return null;
    const user: User = { id: meta.id, email: meta.email,
      name: resolveDisplayName(meta.name, meta.email), roles: meta.roles || [],
      is_super_admin: Boolean(meta.is_super_admin), token: inMemoryAccessToken };
    currentUser = user;
    return user;
  } catch (error) { console.warn('Could not restore authenticated session:', error); return null; }
}
''',
'loginWithCredentials':'''export async function loginWithCredentials(email: string, pass: string): Promise<User> {
  const res = await fetch(`${AUTH_URL}/api/auth/login`, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Đăng nhập thất bại (HTTP ${res.status})`);
  const token = data.token || data.access_token;
  const id = data.userId ?? data.user_id ?? data.id;
  if (!token || !id) throw new Error('Máy chủ xác thực thiếu token hoặc user ID.');
  const roles: string[] = Array.isArray(data.roles) ? data.roles : data.role ? [String(data.role)] : [];
  const user: User = { id, email: data.email || email, name: resolveDisplayName(data.name || data.full_name, email),
    roles, is_super_admin: roles.some(r => /ADMIN|MANAGER/i.test(r)), token };
  await saveSession(user, data.refreshToken || data.refresh_token);
  return user;
}
''',
'loginWithGoogle':'''export async function loginWithGoogle(_mockEmail?: string): Promise<User> {
  throw new Error('Google OAuth chưa được kết nối với dịch vụ xác thực.');
}
''',
'fetchUserOrganizations':'''export async function fetchUserOrganizations(): Promise<UserOrgsResponse> {
  const res = await authFetch(`${BASE_URL}/user/organizations`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Không tải được tổ chức (HTTP ${res.status})`);
  return res.json();
}
''',
'fetchRooms':'''export async function fetchRooms(orgId: number = 1): Promise<Room[]> {
  const res = await authFetch(`${BASE_URL}/orgs/${orgId}/rooms`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Không tải được phòng (HTTP ${res.status})`);
  const data = await res.json(); return data.rooms || [];
}
''',
'startDutyShift':'''export async function startDutyShift(roomId: string, staff?: { id?: string; name?: string; email?: string }): Promise<DutyShiftRecord> {
  const duty_staff_id = staff?.id || String(currentUser?.id || '');
  if (!duty_staff_id) throw new Error('Cần đăng nhập trước khi bắt đầu ca.');
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/shift/start`, { method: 'POST',
    headers: getAuthHeaders(), body: JSON.stringify({ duty_staff_id,
      duty_staff_name: resolveDisplayName(staff?.name || currentUser?.name, staff?.email || currentUser?.email),
      duty_staff_email: staff?.email || currentUser?.email || '' }) });
  if (!res.ok) throw new Error(`Không bắt đầu được ca (HTTP ${res.status})`);
  return res.json();
}
''',
'endDutyShift':'''export async function endDutyShift(roomId: string): Promise<any> {
  if (!currentUser) throw new Error('Cần đăng nhập trước khi kết thúc ca.');
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/shift/end`, { method: 'POST',
    headers: getAuthHeaders(), body: JSON.stringify({ duty_staff_id: String(currentUser.id) }) });
  if (!res.ok) throw new Error(`Không kết thúc được ca (HTTP ${res.status})`);
  return res.json();
}
''',
'fetchCurrentShift':'''export async function fetchCurrentShift(roomId: string): Promise<{ has_active_shift: boolean; shift?: DutyShiftRecord }> {
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/shift/current`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Không tải được ca hiện tại (HTTP ${res.status})`);
  return res.json();
}
''',
'performCheckIn':'''export async function performCheckIn(roomId: string, studentId: string): Promise<CheckInResult> {
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/checkin`, { method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ student_id: studentId.trim(), method: 'BARCODE_SCAN', client_timestamp: new Date().toISOString(),
      scanner_id: currentUser ? String(currentUser.id) : '', scanner_name: resolveDisplayName(currentUser?.name, currentUser?.email) }) });
  if (!res.ok) throw new Error(`Điểm danh vào thất bại (HTTP ${res.status})`);
  const data = await res.json();
  if (data.success !== true) throw new Error(data.error || 'Máy chủ không xác nhận điểm danh.');
  return data;
}
''',
'performCheckOut':'''export async function performCheckOut(roomId: string, studentId: string): Promise<CheckOutResult> {
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/checkout`, { method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ student_id: studentId, method: 'BARCODE_SCAN', client_timestamp: new Date().toISOString() }) });
  if (!res.ok) throw new Error(`Điểm danh ra thất bại (HTTP ${res.status})`);
  const data = await res.json();
  if (data.success !== true) throw new Error(data.error || 'Máy chủ không xác nhận điểm danh.');
  return data;
}
''',
'fetchOccupancy':'''export async function fetchOccupancy(roomId: string): Promise<Occupant[]> {
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/occupancy`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Không tải được số người hiện tại (HTTP ${res.status})`);
  const data = await res.json(); return data.occupants || [];
}
''',
'generateQRToken':'''export async function generateQRToken(studentId: string, studentName: string): Promise<{ payload: string; expires_at: string }> {
  const res = await authFetch(`${BASE_URL}/qr/generate`, { method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ student_id: studentId.trim(), student_name: studentName }) });
  if (!res.ok) throw new Error(`Máy chủ chưa cấp mã QR (HTTP ${res.status})`);
  return res.json();
}
''',
'performQRCheckin':'''export async function performQRCheckin(roomId: string, payload: string): Promise<CheckInResult> {
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/checkin-qr`, { method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ payload, client_timestamp: new Date().toISOString(),
      scanner_id: currentUser ? String(currentUser.id) : '', scanner_name: resolveDisplayName(currentUser?.name, currentUser?.email) }) });
  if (!res.ok) throw new Error(`Không xác thực được QR (HTTP ${res.status})`);
  const data = await res.json();
  if (data.success !== true) throw new Error(data.error || 'Máy chủ không xác nhận điểm danh.');
  return data;
}
''',
'fetchPresenceHistory':'''export async function fetchPresenceHistory(roomId: string, limit: number = 20, offset: number = 0): Promise<PresenceHistoryItem[]> {
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/presence-history?limit=${limit}&offset=${offset}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Không tải được lịch sử điểm danh (HTTP ${res.status})`);
  const data = await res.json(); return data.history || [];
}
''',
'fetchDutyHistory':'''export async function fetchDutyHistory(roomId: string, limit: number = 20, offset: number = 0): Promise<DutyShiftRecord[]> {
  const res = await authFetch(`${BASE_URL}/rooms/${roomId}/duty-history?limit=${limit}&offset=${offset}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Không tải được lịch sử ca (HTTP ${res.status})`);
  const data = await res.json(); return data.shifts || [];
}
''',
}
# Split at named top-level exports. All identified functions are replaced without touching other exports.
parts=re.split(r'(?=^export async function )',text,flags=re.M)
found=[]
for i,part in enumerate(parts):
 m=re.match(r'export async function (\w+)\(',part)
 if m and m.group(1) in patches:
  name=m.group(1)
  # drop old function plus comments up to next exported function.
  parts[i]=patches[name]+'\n'
  found.append(name)
if set(found)!=set(patches):
 raise RuntimeError(f'client.ts mismatch; missing exports: {set(patches)-set(found)}')
p.write_text(''.join(parts))
print(f'Hardened {len(found)} API functions (fail-closed).')
