import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import type { DutyShiftRecord, Room, User } from '../../types';
import { fetchDutyHistory } from '../../api/client';
import { cancelShift, DutyRegistration, fetchMyRegistrations } from '../../api/reservations';
import { Card, Chip, Empty, Spinner, textStyles } from '../../ui/Kit';
import { clock, dateLabel, palette, roomShort } from '../../ui/theme';
export const ShiftsScreen: React.FC<{ user: User; rooms: Room[]; onRegister: () => void; onSelectRoom: () => void }> = ({ user, rooms, onRegister, onSelectRoom }) => {
  const [mine, setMine] = useState(true);
  const [past, setPast] = useState(false);
  const [legacy, setLegacy] = useState<DutyShiftRecord[]>([]);
  const [bookings, setBookings] = useState<DutyRegistration[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setError('');
    const result = await Promise.allSettled([fetchMyRegistrations(), ...rooms.map(room => fetchDutyHistory(room.id, 30, 0))]);
    if (result[0].status === 'fulfilled') setBookings(result[0].value as DutyRegistration[]);
    else setError((result[0] as { reason: Error; status: string }).reason?.message || 'Không tải được đăng ký ca.');
    const shifts = result.slice(1).flatMap(r => r.status === 'fulfilled' ? r.value as DutyShiftRecord[] : []);
    const unique = new Map(shifts.map(s => [`${s.room_id}:${s.id}`, s]));
    setLegacy(Array.from(unique.values()).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()));
  }, [rooms.map(r => r.id).join('|')]);
  useEffect(() => { setPending(true); load().finally(() => setPending(false)); }, [load]);
  async function remove(id: number) {
    try { await cancelShift(id); await load(); }
    catch (e: any) { setError(e?.message || 'Không hủy được ca.'); }
  }
  function requestCancellation(id: number) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Hủy đăng ký ca này?')) void remove(id);
    } else Alert.alert('Hủy ca trực?', 'Ca đã hủy không thể khôi phục.', [ { text: 'Giữ lại' }, { text: 'Hủy ca', style: 'destructive', onPress: () => void remove(id) } ]);
  }
  const now = Date.now();
  const myBookings = bookings.filter(b => b.status === 'BOOKED' && (past ? new Date(`${b.duty_date}T${b.ends_at}:00+07:00`).getTime() < now : new Date(`${b.duty_date}T${b.ends_at}:00+07:00`).getTime() >= now));
  const recent = legacy.filter(s => (!mine || String(s.duty_staff_id) === String(user.id)) && (past ? s.status === 'COMPLETED' : s.status === 'ACTIVE'));
  return <ScrollView contentContainerStyle={styles.root} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}/> }>
    <View style={styles.header}><Text style={textStyles.title}>Ca trực của tôi</Text><TouchableOpacity style={styles.register} onPress={onRegister}><CalendarDays size={17} color={palette.blue}/><Text style={styles.registerText}>Đăng ký ca</Text></TouchableOpacity></View>
    <View style={styles.switch}><Segment active={mine} label="Của tôi" onPress={() => setMine(true)}/><Segment active={!mine} label="Cả CLB (đã trực)" onPress={() => setMine(false)}/></View>
    <View style={[styles.switch, { backgroundColor: palette.white, marginTop: 10 }]}><Segment active={!past} label="Sắp tới / đang trực" onPress={() => setPast(false)}/><Segment active={past} label="Đã qua" onPress={() => setPast(true)}/></View>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Text style={styles.sectionTitle}>Lịch đăng ký của tôi</Text>
    {pending ? <Spinner/> : <Card style={{ paddingVertical: 4 }}>{myBookings.length ? myBookings.map((b, i) => <View key={b.id} style={[styles.item, i > 0 && styles.separator]}>
      <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{b.room_name}</Text><Text style={textStyles.muted}>{b.label} · {b.duty_date} · {b.starts_at}–{b.ends_at}</Text></View>
      {!past ? <TouchableOpacity onPress={() => requestCancellation(b.id)}><Text style={styles.cancel}>Hủy ca</Text></TouchableOpacity> : <Chip title="Đã qua" tone="gray"/>}</View>)
      : <Empty title="Chưa có ca đã đặt" description="Đăng ký ca từ trang chủ để xem lịch tại đây."/>}</Card>}
    <Text style={styles.sectionTitle}>Ca đã bắt đầu / kết thúc</Text>
    {pending ? <Spinner/> : <Card style={{ paddingVertical: 4 }}>{recent.length ? recent.map((s, i) => <View key={`${s.room_id}-${s.id}`} style={[styles.item, i > 0 && styles.separator]}>
      <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{roomShort(rooms.find(r => r.id === s.room_id) || { room_number: '?', building: '?' })} · {s.duty_staff_name}</Text>
      <Text style={textStyles.muted}>{dateLabel(s.start_time)} · {clock(s.start_time)}–{s.end_time ? clock(s.end_time) : 'đang trực'}</Text></View>
      <Chip title={s.status === 'COMPLETED' ? 'Hoàn tất' : 'Đang trực'} tone={s.status === 'COMPLETED' ? 'gray' : 'green'}/></View>)
      : <Empty title="Chưa có dữ liệu" description="Thử đổi bộ lọc hoặc kéo xuống làm mới."/>}</Card>}
    <TouchableOpacity onPress={onSelectRoom}><Text style={styles.roomLink}>Chọn phòng để xem chi tiết ›</Text></TouchableOpacity>
  </ScrollView>;
};
function Segment({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.segment, active && styles.segmentActive]}><Text style={[styles.segmentText, active && { color: palette.blue }]}>{label}</Text></TouchableOpacity>;
}
const styles = StyleSheet.create({ root: { padding: 18, paddingTop: 26, paddingBottom: 30 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  register: { borderRadius: 24, borderColor: '#BED1FF', borderWidth: 1, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 11 }, registerText: { color: palette.blue, fontSize: 11, fontWeight: '800' },
  switch: { flexDirection: 'row', backgroundColor: '#E6ECF5', borderRadius: 24, padding: 4 }, segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 22 },
  segmentActive: { backgroundColor: palette.white }, segmentText: { color: palette.muted, fontSize: 12, fontWeight: '800' },
  sectionTitle: { color: palette.ink, fontWeight: '800', fontSize: 15, marginTop: 23, marginBottom: 11 },
  item: { paddingVertical: 17, flexDirection: 'row', gap: 8, alignItems: 'center' }, itemTitle: { color: palette.ink, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  separator: { borderTopWidth: 1, borderTopColor: palette.line }, roomLink: { marginTop: 23, textAlign: 'center', color: palette.blue, fontSize: 12, fontWeight: '700' },
  cancel: { color: palette.red, padding: 10, fontWeight: '700' }, error: { backgroundColor: palette.redWash, color: palette.red, padding: 12, borderRadius: 12, marginTop: 15 },
});
