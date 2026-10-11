import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, Check, Clock3 } from 'lucide-react-native';
import type { DutyShiftRecord, Room, User } from '../../types';
import { fetchDutyHistory } from '../../api/client';
import { ActionButton, Card, Chip, Empty, Spinner, textStyles } from '../../ui/Kit';
import { clock, dateLabel, palette, roomShort } from '../../ui/theme';
export const ShiftsScreen: React.FC<{ user: User; rooms: Room[]; onRegister: () => void; onSelectRoom: () => void }> = ({ user, rooms, onRegister, onSelectRoom }) => {
  const [mine, setMine] = useState(true);
  const [past, setPast] = useState(true);
  const [data, setData] = useState<DutyShiftRecord[]>([]);
  const [pending, setPending] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    // Existing service tracks started duty shifts, not future registrations.
    const result = await Promise.allSettled(rooms.map(room => fetchDutyHistory(room.id, 30, 0)));
    const shifts = result.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const unique = new Map(shifts.map(s => [`${s.room_id}:${s.id}`, s]));
    setData(Array.from(unique.values()).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()));
  }, [rooms.map(r => r.id).join('|')]);
  useEffect(() => { setPending(true); load().finally(() => setPending(false)); }, [load]);
  const selected = data.filter(s => (!mine || String(s.duty_staff_id) === String(user.id)) && (past ? s.status === 'COMPLETED' : s.status === 'ACTIVE'));
  return <ScrollView contentContainerStyle={styles.root} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}/> }>
    <View style={styles.header}><Text style={textStyles.title}>Ca trực của tôi</Text><TouchableOpacity style={styles.register} onPress={onRegister}><CalendarDays size={17} color={palette.blue}/><Text style={styles.registerText}>Đăng ký ca</Text></TouchableOpacity></View>
    <View style={styles.switch}><Segment active={mine} label="Của tôi" onPress={() => setMine(true)}/><Segment active={!mine} label="Cả CLB" onPress={() => setMine(false)}/></View>
    <View style={[styles.switch, { backgroundColor: palette.white, marginTop: 10 }]}><Segment active={!past} label="Đang hoạt động" onPress={() => setPast(false)}/><Segment active={past} label="Đã qua" onPress={() => setPast(true)}/></View>
    <Text style={[textStyles.muted, { marginVertical: 10 }]}>Lịch sử ca đã bắt đầu/kết thúc. Lịch đặt trước sẽ xuất hiện khi backend hỗ trợ đăng ký.</Text>
    {pending ? <Spinner/> : <Card style={{ paddingVertical: 2 }}>
      {selected.length ? selected.map((shift, i) => <View key={`${shift.room_id}-${shift.id}`} style={[styles.item, i > 0 && styles.separator]}>
        <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{roomShort(rooms.find(r => r.id === shift.room_id) || { room_number: '?', building: '?' })} · {shift.duty_staff_name}</Text>
          <Text style={textStyles.muted}>{dateLabel(shift.start_time)} · {clock(shift.start_time)}–{shift.end_time ? clock(shift.end_time) : 'đang trực'}</Text></View>
        <Chip title={shift.status === 'COMPLETED' ? 'Hoàn tất' : 'Đang trực'} tone={shift.status === 'COMPLETED' ? 'gray' : 'green'}/></View>)
        : <Empty title="Chưa có ca trong bộ lọc" description="Hãy đổi bộ lọc hoặc kéo xuống để cập nhật dữ liệu."/>}
    </Card>}
    <TouchableOpacity onPress={onSelectRoom}><Text style={styles.roomLink}>Chọn phòng để xem dữ liệu chi tiết ›</Text></TouchableOpacity>
  </ScrollView>;
};
function Segment({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.segment, active && styles.segmentActive]}><Text style={[styles.segmentText, active && { color: palette.blue }]}>{label}</Text></TouchableOpacity>;
}
const styles = StyleSheet.create({ root: { padding: 18, paddingTop: 26, paddingBottom: 30 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  register: { borderRadius: 24, borderColor: '#BED1FF', borderWidth: 1, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 11 }, registerText: { color: palette.blue, fontSize: 11, fontWeight: '800' },
  switch: { flexDirection: 'row', backgroundColor: '#E6ECF5', borderRadius: 24, padding: 4 }, segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 22 },
  segmentActive: { backgroundColor: palette.white }, segmentText: { color: palette.muted, fontSize: 12, fontWeight: '800' },
  item: { paddingVertical: 18, flexDirection: 'row', gap: 8, alignItems: 'center' }, itemTitle: { color: palette.ink, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  separator: { borderTopWidth: 1, borderTopColor: palette.line }, roomLink: { marginTop: 23, textAlign: 'center', color: palette.blue, fontSize: 12, fontWeight: '700' },
});
