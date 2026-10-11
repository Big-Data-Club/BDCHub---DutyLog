export const palette = {
  blue: '#2860EE',
  blueDark: '#1948D3',
  blueWash: '#ECF3FF',
  ink: '#111A2E',
  muted: '#647997',
  faint: '#91A2BA',
  bg: '#F2F4F8',
  white: '#FFFFFF',
  line: '#DBE4F0',
  green: '#16A34A',
  greenWash: '#EEFBF3',
  orange: '#F59E0B',
  orangeWash: '#FFF8E7',
  red: '#E73C45',
  redWash: '#FFF1F2',
} as const;
export const spacing = { page: 19, card: 18, radius: 21, gap: 12 } as const;
export const formatDay = (date: Date) =>
  date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
export const clock = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.valueOf()) ? '—' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
export const dateLabel = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.valueOf()) ? '—' : d.toLocaleDateString('vi-VN');
};
export const roomShort = (room: { room_number: string; building: string }) =>
  `${room.room_number} ${room.building}`;
export const elapsed = (startTime: string, now: number) => {
  const seconds = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};
