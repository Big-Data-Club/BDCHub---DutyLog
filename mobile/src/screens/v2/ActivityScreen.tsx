import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DoorOpen, LogOut, Play, UserRound } from 'lucide-react-native';
import type { PresenceHistoryItem, Room, User } from '../../types';
import { fetchPresenceHistory } from '../../api/client';
import { Card, Chip, Empty, SmallLabel, Spinner, textStyles } from '../../ui/Kit';
import { clock, dateLabel, palette, roomShort } from '../../ui/theme';
export const ActivityScreen: React.FC<{ user: User; rooms: Room[] }> = ({ user, rooms }) => {
  const [mine, setMine] = useState(true);
  const [kind, setKind] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [events, setEvents] = useState<PresenceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    const settled = await Promise.allSettled(rooms.map(r => fetchPresenceHistory(r.id, 30, 0)));
    setLoadError(settled.some(s => s.status === 'rejected') ? 'Không thể tải toàn bộ lịch sử từ máy chủ. Vui lòng thử lại.' : '');
    const records = settled.flatMap(s => s.status === 'fulfilled' ? s.value : []);
    const unique = new Map(records.map(e => [`${e.room_id}:${e.id}`, e]));
    setEvents(Array.from(unique.values()).sort((a, b) => new Date(b.check_out_at || b.check_in_at).getTime() - new Date(a.check_out_at || a.check_in_at).getTime()));
  }, [rooms.map(r => r.id).join('|')]);
  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);
  const filtered = useMemo(() => events.filter(e => (!mine || String(e.scanner_id) === String(user.id)) &&
    (kind === 'ALL' || (kind === 'IN' && !e.check_out_at) || (kind === 'OUT' && !!e.check_out_at))), [events, mine, kind, user.id]);
  const groups = useMemo(() => {
    // Presence rows are sessions, not separate scan events; this view labels the final state.
    const map = new Map<string, PresenceHistoryItem[]>();
    for (const e of filtered) { const day = dateLabel(e.check_out_at || e.check_in_at); map.set(day, [...(map.get(day) || []), e]); }
    return Array.from(map.entries());
  }, [filtered]);
  return <ScrollView contentContainerStyle={styles.root} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}/> }>
    <SmallLabel>NHẬT KÝ</SmallLabel><Text style={[textStyles.title, { marginTop: 6, marginBottom: 15 }]}>Hoạt động</Text>
    <View style={styles.segment}><Filter selected={mine} onPress={() => setMine(true)} title="Tôi quét"/><Filter selected={!mine} onPress={() => setMine(false)} title="Cả phòng"/></View>
    <View style={styles.filters}><Filter selected={kind === 'ALL'} onPress={() => setKind('ALL')} title="Tất cả"/><Filter selected={kind === 'IN'} onPress={() => setKind('IN')} title="Vào"/><Filter selected={kind === 'OUT'} onPress={() => setKind('OUT')} title="Ra"/></View>
    <Text style={[textStyles.muted, { marginBottom: 12 }]}>“Tôi quét” lọc theo người thực hiện thao tác; không phải tất cả lần bạn được điểm danh.</Text>
    {!!loadError && <View style={{ backgroundColor: palette.orangeWash, padding: 12, borderRadius: 10, marginBottom: 12 }}><Text style={{ color: palette.orange, fontSize: 12 }}>{loadError}</Text></View>}
    {loading ? <Spinner/> : <Card style={{ paddingVertical: 8 }}>
      {groups.length ? groups.map(([day, rows]) => <View key={day}><Text style={styles.day}>{day}</Text>
        {rows.map((e, i) => { const left = !!e.check_out_at;
          return <View key={e.room_id + ':' + e.id} style={[styles.row, i > 0 && styles.rowBorder]}>
            <View style={[styles.circle, { backgroundColor: left ? palette.orangeWash : palette.greenWash }]}>{left ? <LogOut size={18} color={palette.orange}/> : <DoorOpen size={18} color={palette.green}/>}</View>
            <View style={{ flex: 1 }}><Text style={styles.name}>{e.student_name || e.student_id}</Text>
              <Text style={styles.sub}>MSSV {e.student_id} · {roomShort(rooms.find(r => r.id === e.room_id) || { room_number: '?', building: '?' })}</Text></View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}><Text style={styles.time}>{clock(e.check_out_at || e.check_in_at)}</Text><Chip tone={left ? 'orange' : 'green'} title={left ? 'Rời phòng' : 'Vào phòng'}/></View>
          </View>;
        })}</View>) : <Empty title="Không có hoạt động" description="Thử đổi bộ lọc hoặc chọn phòng khác."/>}
    </Card>}
  </ScrollView>;
};
function Filter({ selected, title, onPress }: { selected: boolean; title: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.filter, selected && styles.selected]}><Text style={[styles.filterText, selected && { color: palette.blue }]}>{title}</Text></TouchableOpacity>;
}
const styles = StyleSheet.create({ root: { padding: 18, paddingTop: 31, paddingBottom: 28 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 24, backgroundColor: '#E7EBF3', marginBottom: 11 },
  filters: { flexDirection: 'row', padding: 3, gap: 4, borderRadius: 25, marginBottom: 12 },
  filter: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 24, backgroundColor: palette.white },
  selected: { backgroundColor: palette.blueWash }, filterText: { fontWeight: '800', color: palette.muted, fontSize: 12 },
  day: { fontSize: 12, color: palette.ink, fontWeight: '800', marginTop: 13, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 13 }, rowBorder: { borderTopWidth: 1, borderTopColor: palette.line },
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  name: { color: palette.ink, fontWeight: '800', fontSize: 12 }, sub: { color: palette.muted, fontSize: 10, marginTop: 6 },
  time: { color: palette.ink, fontSize: 12, fontWeight: '800' },
});
