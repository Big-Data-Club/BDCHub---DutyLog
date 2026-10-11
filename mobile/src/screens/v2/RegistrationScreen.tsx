import React, { useMemo, useState } from 'react';
import { fetchRooms } from '../../api/client';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, Check, CheckCircle2, Circle, MapPin, Users, Clock3, Info } from 'lucide-react-native';
import type { Organization, Room } from '../../types';
import { ActionButton, Card, Chip, HeaderBack, SmallLabel, textStyles } from '../../ui/Kit';
import { dateLabel, palette, roomShort } from '../../ui/theme';

/** Pure presentation: the current DutyLog API does not expose reservation or slot inventory.
 * Never replace this guard with local success state; wire a real reservation mutation first.
 */
type Shift = { label: string; from: string; to: string };
const shifts: Shift[] = [
  { label: 'Sáng', from: '07:00', to: '11:00' },
  { label: 'Chiều', from: '13:00', to: '17:00' },
  { label: 'Tối', from: '18:00', to: '21:00' },
];
export const RegistrationScreen: React.FC<{
  organizations: Organization[]; selectedOrg: Organization; rooms: Room[]; onBack: () => void;
}> = ({ organizations, selectedOrg, rooms, onBack }) => {
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState(selectedOrg);
  const [roomPool, setRoomPool] = useState<Room[]>(rooms);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [shift, setShift] = useState<Shift | null>(null);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i); return d;
  }), []);
  const availableRooms = roomPool;
  const selectOrg = async (item: Organization) => {
    setOrg(item); setRoom(null); setRoomPool([]);
    if (item.id === selectedOrg.id) { setRoomPool(rooms); return; }
    setLoadingRooms(true);
    try { setRoomPool(await fetchRooms(item.id)); }
    catch { Alert.alert('Không tải được phòng', 'Vui lòng thử lại.'); }
    finally { setLoadingRooms(false); }
  };
  const day = dates[dateOffset];
  const next = () => {
    if (step === 0 && loadingRooms) return;
    if (step === 1 && !room) return Alert.alert('Chọn phòng', 'Vui lòng chọn phòng trực trước khi tiếp tục.');
    if (step === 2 && !shift) return Alert.alert('Chọn ca', 'Vui lòng chọn một khung giờ.');
    setStep(Math.min(3, step + 1));
  };
  const back = () => step > 0 ? setStep(step - 1) : onBack();
  return <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HeaderBack eyebrow={`BƯỚC ${step + 1} / 4`} title="Đăng ký ca trực" onBack={back}/>
      <View style={styles.steps}>{['Tổ chức', 'Phòng trực', 'Ca trực', 'Xác nhận'].map((label, i) =>
        <View key={label} style={styles.step}><View style={[styles.stepBadge, i < step && styles.stepDone, i === step && styles.stepCurrent]}>
          {i < step ? <Check size={14} color={palette.white}/> : <Text style={[styles.stepNum, i < step && { color: palette.white }, i === step && { color: palette.blue }]}>{i + 1}</Text>}
        </View><Text style={[styles.stepLabel, i === step && { color: palette.ink, fontWeight: '800' }]}>{label}</Text></View>
      )}</View>
      {step === 0 && <><Text style={styles.title}>Chọn tổ chức</Text><Text style={styles.sub}>Bạn muốn trực cho tổ chức nào?</Text>
        {organizations.map(item => <TouchableOpacity key={item.id} onPress={() => selectOrg(item)} style={styles.choice}>
          <View style={styles.orgIcon}><Text style={{ color: palette.blue, fontSize: 20, fontWeight: '900' }}>{item.name[0]}</Text></View>
          <View style={styles.choiceMiddle}><SmallLabel>ORG #{item.id} · {item.slug.toUpperCase()}</SmallLabel>
            <Text style={styles.choiceTitle}>{item.name}</Text><Text style={textStyles.muted}>{item.description || 'Tổ chức của bạn'}</Text>
            <Chip title={`${item.room_count ?? (item.id === selectedOrg.id ? rooms.length : 0)} phòng trực`} tone="gray"/></View>
          {org.id === item.id ? <CheckCircle2 color={palette.blue} size={22}/> : <Circle color={palette.line} size={22}/>}</TouchableOpacity>)}
      </>}
      {step === 1 && <><Text style={styles.title}>Chọn phòng và ngày</Text><Text style={styles.sub}>Chọn ngày trực, sau đó chọn phòng.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
          {dates.map((d, i) => <TouchableOpacity onPress={() => setDateOffset(i)} key={i} style={[styles.day, i === dateOffset && styles.dayActive]}><Text style={[styles.dayWeek, i === dateOffset && styles.activeText]}>{i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' })}</Text><Text style={[styles.dayNum, i === dateOffset && styles.activeText]}>{d.getDate()}</Text></TouchableOpacity>)}
        </ScrollView><Text style={styles.dateHeader}>{day.toLocaleDateString('vi-VN')}</Text>
        {availableRooms.length ? availableRooms.map(item => <TouchableOpacity key={item.id} style={[styles.choice, room?.id === item.id && styles.selected]} onPress={() => setRoom(item)}>
          <View style={{ flex: 1 }}><SmallLabel>{item.campus.toUpperCase()} · P.{roomShort(item)}</SmallLabel><Text style={styles.choiceTitle}>{item.name}</Text>
            <View style={styles.infoRow}><Chip title={`Sức chứa: ${item.capacity}`} tone="gray"/><Chip title="Chưa có dữ liệu chỗ trống" tone="orange"/></View></View>
          {room?.id === item.id ? <CheckCircle2 color={palette.blue} size={22}/> : <Circle color={palette.line} size={22}/>}</TouchableOpacity>)
          : <Card><Text style={textStyles.muted}>Chưa tải được danh sách phòng của tổ chức này. Hãy quay lại chọn tổ chức đang hoạt động.</Text></Card>}
      </>}
      {step === 2 && <><Text style={styles.title}>Chọn ca trực</Text><Text style={styles.sub}>Mỗi lần đăng ký một ca. Thời gian có thể được điều chỉnh theo tổ chức.</Text>
        {shifts.map(item => <TouchableOpacity key={item.label} style={[styles.choice, shift?.label === item.label && styles.selected]} onPress={() => setShift(item)}>
          <View style={{ flex: 1 }}><Text style={styles.choiceTitle}>{item.label} · {item.from}–{item.to}</Text>
            <Text style={textStyles.muted}>Trạng thái còn chỗ: chưa xác minh với máy chủ</Text></View>
          {shift?.label === item.label ? <CheckCircle2 color={palette.blue} size={22}/> : <Circle color={palette.line} size={22}/>}</TouchableOpacity>)}
        <Card style={{ marginTop: 12 }}><SmallLabel>CHÚ THÍCH</SmallLabel><Text style={[textStyles.muted, { marginTop: 8 }]}>Các khung giờ ở đây chỉ là cấu hình giao diện. API hiện chưa cung cấp danh sách ca có thể đặt hoặc số chỗ còn lại.</Text></Card>
      </>}
      {step === 3 && <><Text style={styles.title}>Xác nhận đăng ký</Text><Text style={styles.sub}>Kiểm tra lại thông tin trước khi gửi.</Text>
        <Card><SmallLabel>{org.name.toUpperCase()}</SmallLabel><Text style={[styles.title, { fontSize: 19, marginTop: 10 }]}>{room?.name}</Text>
          <Text style={[textStyles.muted, { marginBottom: 16 }]}>P.{room ? roomShort(room) : '—'} · {room?.campus}</Text>
          <View style={styles.separator}/><View style={styles.summaryRow}><CalendarDays color={palette.muted} size={17}/><Text style={styles.summaryText}>{dateLabel(day.toISOString())}</Text>
          <Clock3 color={palette.muted} size={17}/><Text style={styles.summaryText}>{shift?.from}–{shift?.to}</Text></View></Card>
        <View style={styles.notice}><Info size={20} color={palette.blue}/><Text style={styles.noticeText}>Chức năng đặt ca đang chờ API từ backend. Không có dữ liệu nào được gửi hoặc ghi nhận ở bước này.</Text></View>
      </>}
    </ScrollView>
    <View style={styles.bottom}>{step === 3 ? <ActionButton title="Chưa thể xác nhận — cần API đăng ký ca" onPress={() => {}} disabled/> : <ActionButton title="Tiếp tục" onPress={next} disabled={loadingRooms || step === 1 && !room || step === 2 && !shift}/>}</View>
  </View>;
};
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg }, content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30 },
  steps: { flexDirection: 'row', marginBottom: 28, justifyContent: 'space-around' },
  step: { flex: 1, alignItems: 'center', gap: 8 }, stepBadge: { width: 33, height: 33, borderRadius: 17, borderWidth: 2, borderColor: palette.line, justifyContent: 'center', alignItems: 'center' },
  stepDone: { backgroundColor: palette.blue, borderColor: palette.blue }, stepCurrent: { backgroundColor: palette.white, borderColor: palette.blue },
  stepNum: { color: palette.faint, fontSize: 13, fontWeight: '800' }, stepLabel: { color: palette.muted, fontSize: 10 },
  title: { color: palette.ink, fontSize: 20, fontWeight: '900', marginBottom: 5 }, sub: { color: palette.muted, fontSize: 13, marginBottom: 20 },
  choice: { borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, padding: 15, flexDirection: 'row', gap: 13, marginBottom: 11, alignItems: 'center' },
  selected: { borderColor: '#A7C2FF', backgroundColor: '#FCFDFF' },
  orgIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.blueWash },
  choiceMiddle: { flex: 1, gap: 5 }, choiceTitle: { color: palette.ink, fontWeight: '800', fontSize: 14, marginVertical: 4 },
  infoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  day: { width: 62, height: 68, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: palette.blue, borderColor: palette.blue }, dayWeek: { fontSize: 11, color: palette.muted }, dayNum: { fontSize: 21, fontWeight: '900', color: palette.ink }, activeText: { color: palette.white },
  dateHeader: { marginBottom: 13, fontWeight: '800', color: palette.ink },
  separator: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: palette.line, marginBottom: 17 },
  summaryRow: { flexDirection: 'row', gap: 9, alignItems: 'center', flexWrap: 'wrap' }, summaryText: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.blueWash, borderRadius: 16, padding: 15, marginTop: 16 },
  noticeText: { flex: 1, color: palette.blueDark, fontSize: 12, lineHeight: 19 },
  bottom: { padding: 16, backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.line },
});
