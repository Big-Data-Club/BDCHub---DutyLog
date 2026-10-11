import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarPlus, CheckCircle2, DoorOpen, History, QrCode, Radio, ScanLine, Square, UserRound, Users } from 'lucide-react-native';
import type { DutyShiftRecord, Organization, PresenceHistoryItem, Room, User } from '../../types';
import { fetchCurrentShift, fetchOccupancy, fetchPresenceHistory, endDutyShift, resolveDisplayName } from '../../api/client';
import { ActionButton, Card, Chip, Empty, Heading, SmallLabel, Spinner, textStyles } from '../../ui/Kit';
import { clock, elapsed, palette, roomShort } from '../../ui/theme';

interface Props {
  user: User; organization: Organization; rooms: Room[]; selectedRoom: Room | null;
  onSelectRoom: () => void; onRegister: () => void; onScan: () => void; onQR: () => void;
  onShifts: () => void; onActivity: () => void; onProfile: () => void;
}
export const HomeScreen: React.FC<Props> = ({ user, organization, rooms, selectedRoom, onSelectRoom, onRegister, onScan, onQR, onShifts, onActivity, onProfile }) => {
  const [shift, setShift] = useState<DutyShiftRecord | null>(null);
  const [occupancy, setOccupancy] = useState(0);
  const [activity, setActivity] = useState<PresenceHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const load = useCallback(async () => {
    if (!selectedRoom) { setShift(null); setActivity([]); setOccupancy(0); return; }
    const id = selectedRoom.id;
    const [s, occupants, events] = await Promise.allSettled([
      fetchCurrentShift(id), fetchOccupancy(id), fetchPresenceHistory(id, 6, 0),
    ]);
    if (s.status === 'fulfilled') {
      const active = s.value.has_active_shift ? s.value.shift : undefined;
      setShift(active && String(active.duty_staff_id) === String(user.id) ? active : null);
    }
    if (occupants.status === 'fulfilled') setOccupancy(occupants.value.length);
    if (events.status === 'fulfilled') setActivity(events.value.slice(0, 4));
  }, [selectedRoom?.id, user.id]);
  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const stop = () => Alert.alert('Kết thúc ca trực?', 'Hệ thống sẽ ghi nhận thời gian kết thúc ca tại phòng này.', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Kết thúc ca', style: 'destructive', onPress: async () => {
      try { await endDutyShift(selectedRoom!.id); await load(); }
      catch (e: any) { Alert.alert('Không thể kết thúc ca', e?.message || 'Vui lòng thử lại.'); }
    } },
  ]);
  const firstName = resolveDisplayName(user.name, user.email).split(' ').slice(-1).join(' ');
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/> }>
    <View style={styles.topbar}><View style={styles.helloLeft}>
      <Image source={require('../../../assets/bdclogo.png')} style={styles.logo} resizeMode="contain"/>
      <View><Text style={styles.hello}>Chào {firstName}</Text><Text style={styles.subtitle}>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</Text></View>
    </View><TouchableOpacity onPress={onProfile} style={styles.avatar}><UserRound size={21} color={palette.blue} /><View style={styles.onlineDot}/></TouchableOpacity></View>
    {selectedRoom && <TouchableOpacity onPress={onSelectRoom} style={styles.roomSelector}><Text style={styles.roomSelectorText} numberOfLines={1}>📍 {organization.name} · {roomShort(selectedRoom)}</Text><Text style={styles.roomChange}>Đổi phòng ›</Text></TouchableOpacity>}
    {loading && !activity.length ? <Spinner/> : null}
    <Card style={[styles.hero, shift ? styles.heroActive : undefined]}>
      {shift ? <><View style={styles.statusRow}><View style={styles.greenDot}/><Text style={styles.activeLabel}>ĐANG TRỰC</Text><Radio size={14} color={palette.green}/></View>
        <Text style={styles.timer}>{elapsed(shift.start_time, now)}</Text>
        <View style={styles.capacity}><Users size={14} color={palette.blue}/><Text style={{ color: palette.muted, fontSize: 13 }}> {occupancy}/{selectedRoom?.capacity ?? '—'} người có mặt</Text></View>
        <ActionButton title="Quét điểm danh" onPress={onScan} icon={<ScanLine color={palette.white} size={18}/>}/>
        <View style={{ height: 10 }}/><ActionButton title="Kết thúc ca" outline danger onPress={stop} icon={<Square size={14} color={palette.red} fill={palette.red}/>}/>
      </> : <><View style={styles.statusRow}><Text style={styles.noShift}>◌  CHƯA CÓ CA</Text></View>
        <Text style={styles.heroTitle}>Bạn chưa có ca trực đang hoạt động</Text>
        <Text style={textStyles.muted}>Đăng ký lịch trực hoặc chọn phòng để xem hoạt động.</Text>
        <View style={{ height: 17 }}/><ActionButton title="Đăng ký ca trực" onPress={onRegister} icon={<CalendarPlus color={palette.white} size={17}/>}/>
      </>}
    </Card>
    <Card style={styles.shortcuts}><Shortcut Icon={ScanLine} color={palette.blue} bg={palette.blueWash} title="Quét" action={onScan}/>
      <Shortcut Icon={CalendarPlus} color="#E67D00" bg="#FFF9E9" title={'Đăng ký\nca'} action={onRegister}/>
      <Shortcut Icon={QrCode} color={palette.green} bg={palette.greenWash} title={'Mã QR\ncủa tôi'} action={onQR}/>
      <Shortcut Icon={History} color={palette.muted} bg={palette.bg} title="Lịch sử" action={onShifts}/></Card>
    <Heading title="Hoạt động gần đây" link="Xem tất cả" onLink={onActivity}/>
    <Card style={{ paddingVertical: 6 }}>
      {activity.length ? activity.map((item, i) => {
        const out = !!item.check_out_at;
        return <View key={item.id + ':' + i} style={[styles.activityRow, i > 0 && styles.rowBorder]}>
          <View style={[styles.smallIcon, { backgroundColor: out ? palette.orangeWash : palette.greenWash }]}><DoorOpen size={19} color={out ? palette.orange : palette.green}/></View>
          <View style={{ flex: 1 }}><Text style={styles.name} numberOfLines={1}>{item.student_name || item.student_id}</Text>
            <Text style={styles.meta} numberOfLines={1}>MSSV {item.student_id} · {roomShort(selectedRoom!)}</Text></View>
          <View style={{ alignItems: 'flex-end', gap: 5 }}><Text style={styles.time}>{clock(out ? item.check_out_at : item.check_in_at)}</Text><Chip title={out ? 'Rời phòng' : 'Vào phòng'} tone={out ? 'orange' : 'green'}/></View>
        </View>;
      }) : <Empty title="Chưa có lượt điểm danh" description="Hoạt động của phòng sẽ xuất hiện tại đây."/>}
    </Card>
  </ScrollView>;
};
function Shortcut({ Icon, color, bg, title, action }: { Icon: React.ComponentType<any>; color: string; bg: string; title: string; action: () => void }) {
  return <TouchableOpacity onPress={action} style={styles.shortcut} accessibilityLabel={title.replace('\n',' ')}><View style={[styles.shortcutIcon, { backgroundColor: bg }]}><Icon color={color} size={22}/></View><Text style={styles.shortcutText}>{title}</Text></TouchableOpacity>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 24 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  helloLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 }, logo: { width: 52, height: 45, backgroundColor: palette.white, borderRadius: 12 },
  hello: { fontSize: 20, fontWeight: '900', color: palette.ink }, subtitle: { color: palette.muted, fontSize: 12 },
  avatar: { width: 47, height: 47, backgroundColor: palette.white, borderRadius: 27, borderWidth: 1.5, borderColor: palette.blue, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: palette.green, right: -2, bottom: 0, borderWidth: 1, borderColor: palette.white },
  roomSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13, paddingHorizontal: 5, gap: 4 },
  roomSelectorText: { flex: 1, fontSize: 11, color: palette.muted }, roomChange: { color: palette.blue, fontWeight: '700', fontSize: 11 },
  hero: { marginBottom: 17, paddingVertical: 21 }, heroActive: { borderWidth: 1, borderColor: '#ACE2C2' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 13 },
  greenDot: { width: 8, height: 8, backgroundColor: palette.green, borderRadius: 5 },
  activeLabel: { color: '#078637', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  noShift: { color: palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { fontSize: 19, fontWeight: '900', color: palette.ink, marginBottom: 5 },
  timer: { fontSize: 40, fontWeight: '900', color: palette.ink, marginBottom: 8, letterSpacing: -1.4 },
  capacity: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  shortcuts: { paddingHorizontal: 8, paddingVertical: 17, flexDirection: 'row', justifyContent: 'space-around' },
  shortcut: { flex: 1, alignItems: 'center', gap: 7 }, shortcutIcon: { width: 49, height: 49, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  shortcutText: { color: palette.ink, fontSize: 11, fontWeight: '700', textAlign: 'center', minHeight: 29 },
  activityRow: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center', gap: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: palette.line },
  smallIcon: { width: 34, height: 34, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '800', color: palette.ink, fontSize: 12 }, meta: { fontSize: 10, color: palette.muted, marginTop: 4 },
  time: { color: palette.muted, fontSize: 11 },
});
