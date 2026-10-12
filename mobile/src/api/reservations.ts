import { getAuthToken, refreshAccessToken } from './client';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8086/api/v1').replace(/\/$/, '');

export type AvailableSlot = {
  id: number; label: string; starts_at: string; ends_at: string;
  capacity: number; remaining: number; status: 'OPEN' | 'FULL' | 'STARTED';
};
export type Availability = { organization_id: number; room_id: string; date: string; timezone: string; slots: AvailableSlot[] };
export type DutyRegistration = {
  id: number; user_id: number; organization_id: number; room_id: string; room_name: string;
  slot_id: number; label: string; duty_date: string; starts_at: string; ends_at: string;
  status: 'BOOKED' | 'CANCELLED'; created_at: string;
};
export type CreateRegistration = { id: number; status: string; room_id: string; slot_id: number; duty_date: string; replayed: boolean };
export class ReservationApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ReservationApiError'; }
}
async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  async function send(): Promise<Response> {
    const token = getAuthToken();
    if (!token) throw new ReservationApiError(401, 'Vui lòng đăng nhập lại.');
    return fetch(BASE_URL + url, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers, Authorization: `Bearer ${token}` } });
  }
  let res = await send();
  if (res.status === 401 && await refreshAccessToken()) res = await send();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ReservationApiError(res.status, data.error || data.message || `Máy chủ trả về HTTP ${res.status}`);
  return data as T;
}
export async function fetchAvailability(orgId: number, roomId: string, date: string): Promise<Availability> {
  return request<Availability>(`/orgs/${orgId}/rooms/${encodeURIComponent(roomId)}/availability?date=${encodeURIComponent(date)}`);
}
export async function bookShift(input: { organization_id: number; room_id: string; slot_id: number; date: string }, idempotencyKey: string): Promise<CreateRegistration> {
  return request<CreateRegistration>('/duty-registrations', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) });
}
export async function fetchMyRegistrations(): Promise<DutyRegistration[]> {
  const data = await request<{ registrations: DutyRegistration[] }>('/me/duty-registrations');
  return data.registrations;
}
export async function cancelShift(id: number): Promise<void> {
  await request(`/duty-registrations/${id}`, { method: 'DELETE' });
}
