// Build-time replacement for the demo ONLY. Production screens and API clients stay unchanged.
import type { CheckInResult, CheckOutResult, DutyShiftRecord, Occupant, Organization, PresenceHistoryItem, Room, User } from '../src/types';
import type { AvailableSlot, DutyRegistration } from '../src/api/reservations';

export const demoUser: User = { id: 90001, name: 'Minh An', email: 'minhan@example.com', roles: ['MEMBER'], is_super_admin: false, token: '' };
export const demoOrg: Organization = { id: 1, slug: 'big-data-club', name: 'Big Data Club', description: 'Cộng đồng cùng học, cùng làm.', room_count: 3, org_role: 'MEMBER' };
export const demoRooms: Room[] = [
  { id: 'CS1-303-B9', organization_id: 1, campus: 'Cơ sở 1', building: 'B9', room_number: '303', name: 'Phòng sinh hoạt BDC', capacity: 20, is_active: true, current_occupancy: 3 },
  { id: 'CS1-605-C6', organization_id: 1, campus: 'Cơ sở 1', building: 'C6', room_number: '605', name: 'Không gian học tập', capacity: 25, is_active: true, current_occupancy: 0 },
  { id: 'CS2-710-H6', organization_id: 1, campus: 'Cơ sở 2', building: 'H6', room_number: '710', name: 'Phòng sinh hoạt cơ sở 2', capacity: 30, is_active: true, current_occupancy: 0 },
];
const stamp = (minutesAgo = 0) => new Date(Date.now() - minutesAgo * 60000).toISOString();
const people = [ ['DEMO002', 'Gia Hân'], ['DEMO003', 'Tuấn Minh'], ['DEMO004', 'Bảo Ngọc'] ];
let events: PresenceHistoryItem[] = [];
let shifts: DutyShiftRecord[] = [];
let bookings: DutyRegistration[] = [];
let offline = false;
let nextId = 100;
function updateRoomCounts() { demoRooms.forEach(room => { room.current_occupancy = events.filter(e => e.room_id === room.id && !e.check_out_at).length; }); }
export function resetDemo() {
  offline = false;
  bookings = [];
  nextId = 100;
  events = people.map(([student_id, student_name], i) => ({ id: i + 1, organization_id: 1, room_id: demoRooms[0].id, student_id, student_name, check_in_at: stamp(20 - i * 4), check_out_at: null, duration_seconds: null, scan_method: 'BARCODE', is_on_duty: false, scanner_id: String(demoUser.id), scanner_name: demoUser.name, is_valid_member: true, is_system_user: true, created_at: stamp(20 - i * 4) }));
  shifts = [{ id: 1, organization_id: 1, room_id: demoRooms[0].id, duty_staff_id: String(demoUser.id), duty_staff_name: demoUser.name, duty_staff_email: demoUser.email, start_time: stamp(32), end_time: null, status: 'ACTIVE', duration_seconds: 0 }];
  updateRoomCounts();
}
resetDemo();
function connected() { if (offline) throw new Error('Mất kết nối demo. Chưa ghi nhận thay đổi. Hãy bật lại kết nối và thử lại.'); }
export function setDemoOffline(value: boolean) { offline = value; }
export function resolveDisplayName(name?: string) { return name || 'Thành viên demo'; }
export async function fetchRooms() { connected(); return demoRooms.map(r => ({ ...r, current_occupancy: events.filter(e => e.room_id === r.id && !e.check_out_at).length })); }
export async function fetchCurrentShift(roomId: string) { connected(); const shift = shifts.find(s => s.room_id === roomId && s.status === 'ACTIVE'); return { has_active_shift: !!shift, shift }; }
export async function fetchOccupancy(roomId: string): Promise<Occupant[]> { connected(); return events.filter(e => e.room_id === roomId && !e.check_out_at).map(e => ({ ...e, is_on_duty: false })); }
export async function fetchPresenceHistory(roomId: string, limit = 30) { connected(); return events.filter(e => e.room_id === roomId).slice(0, limit).map(e => ({ ...e })); }
export async function fetchDutyHistory(roomId: string) { connected(); return shifts.filter(s => s.room_id === roomId).map(s => ({ ...s })); }
export async function startDutyShift(roomId: string) {
  connected();
  if (shifts.some(s => s.room_id === roomId && s.status === 'ACTIVE')) throw new Error('Phòng đã có ca đang hoạt động.');
  const shift: DutyShiftRecord = { id: nextId++, organization_id: 1, room_id: roomId, duty_staff_id: String(demoUser.id), duty_staff_name: demoUser.name, duty_staff_email: demoUser.email, start_time: stamp(), end_time: null, status: 'ACTIVE', duration_seconds: 0 };
  shifts = [shift, ...shifts];
  return shift;
}
export async function endDutyShift(roomId: string) {
  connected();
  shifts = shifts.map(s => s.room_id === roomId && s.status === 'ACTIVE' ? { ...s, status: 'COMPLETED', end_time: stamp() } : s);
  events = events.map(e => e.room_id === roomId && !e.check_out_at ? { ...e, check_out_at: stamp(), duration_seconds: 1800 } : e);
  updateRoomCounts();
  return { success: true };
}
export async function performCheckIn(roomId: string, studentId: string): Promise<CheckInResult> {
  connected();
  if (studentId !== 'DEMO001') throw new Error('Không tìm thấy thành viên. Dùng MSSV mẫu DEMO001 để trải nghiệm.');
  if (events.some(e => e.room_id === roomId && e.student_id === studentId && !e.check_out_at)) throw new Error('Thành viên đã ở trong phòng. Chọn Rời phòng để check-out.');
  if (!shifts.some(s => s.room_id === roomId && s.status === 'ACTIVE')) throw new Error('Phòng chưa có ca trực. Hãy đặt lại demo để thử ca mẫu.');
  const row: PresenceHistoryItem = { id: nextId++, organization_id: 1, room_id: roomId, student_id: studentId, student_name: 'Khánh Linh', check_in_at: stamp(), check_out_at: null, duration_seconds: null, scan_method: 'BARCODE', is_on_duty: false, scanner_id: String(demoUser.id), scanner_name: demoUser.name, is_valid_member: true, is_system_user: true, created_at: stamp() };
  events = [row, ...events];
  updateRoomCounts();
  return { success: true, presence_id: row.id, room_id: roomId, student_id: studentId, student_name: row.student_name, check_in_at: row.check_in_at, is_on_duty: false, current_room_occupancy: (await fetchOccupancy(roomId)).length, is_valid_member: true, is_system_user: true, alert_color: 'GREEN', alert_message: 'Khánh Linh đã vào phòng · Dữ liệu minh họa' };
}
export async function performCheckOut(roomId: string, studentId: string): Promise<CheckOutResult> {
  connected();
  const row = events.find(e => e.room_id === roomId && e.student_id === studentId && !e.check_out_at);
  if (!row) throw new Error('Thành viên chưa có mặt trong phòng. Hãy ghi nhận Vào phòng trước.');
  row.check_out_at = stamp(); row.duration_seconds = 1800;
  updateRoomCounts();
  return { success: true, room_id: roomId, student_id: studentId, check_out_at: row.check_out_at, duration_seconds: 1800, current_room_occupancy: (await fetchOccupancy(roomId)).length };
}
export async function performQRCheckin(roomId: string) { return performCheckIn(roomId, 'DEMO001'); }
export async function fetchStudentProfile() { connected(); return { id: 'DEMO001', name: 'Khánh Linh', email: 'khanhlinh@example.com', code: 'DEMO001', role: 'Thành viên', organization: 'Big Data Club' }; }
export async function generateQRToken() { connected(); return { payload: 'DUTYLOG-DEMO-NOT-A-VALID-CREDENTIAL', expires_at: new Date(Date.now() + 10000).toISOString() }; }
export async function fetchMyRegistrations() { connected(); return bookings.map(b => ({ ...b })); }
export async function cancelShift(id: number) { connected(); bookings = bookings.filter(b => b.id !== id); }
export async function fetchAvailability(_orgId: number, roomId: string, date: string) {
  connected();
  const slots: AvailableSlot[] = [
    { id: 1, label: 'Ca sáng', starts_at: '08:00', ends_at: '11:30', capacity: 3, remaining: 2, status: 'OPEN' },
    { id: 2, label: 'Ca chiều', starts_at: '13:00', ends_at: '17:00', capacity: 3, remaining: 0, status: 'FULL' },
  ];
  return { room_id: roomId, date, timezone: 'Asia/Ho_Chi_Minh', slots };
}
export async function bookShift(input: { room_id: string; date: string; slot_id: number }) {
  connected();
  if (input.slot_id !== 1) throw new Error('Ca này đã đầy. Vui lòng chọn ca khác.');
  if (bookings.some(b => b.room_id === input.room_id && b.duty_date === input.date)) throw new Error('Bạn đã đăng ký ca này trong demo.');
  const booking: DutyRegistration = { id: nextId++, user_id: demoUser.id, organization_id: 1, slot_id: input.slot_id, created_at: stamp(), status: 'BOOKED', room_id: input.room_id, room_name: demoRooms.find(r => r.id === input.room_id)?.name || '', duty_date: input.date, label: 'Ca sáng', starts_at: '08:00', ends_at: '11:30' };
  bookings = [...bookings, booking];
  return { ...booking, replayed: false };
}
