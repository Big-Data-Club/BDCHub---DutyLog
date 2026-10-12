import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, Check, CheckCircle2, Circle, Clock3, Info } from 'lucide-react-native';
import { fetchRooms } from '../../api/client';
import { AvailableSlot, bookShift, fetchAvailability } from '../../api/reservations';
import type { Organization, Room } from '../../types';
import { ActionButton, Card, Chip, HeaderBack, SmallLabel, textStyles } from '../../ui/Kit';
import { palette, roomShort } from '../../ui/theme';

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function newKey() { return (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-dutylog`; }

export const RegistrationScreen: React.FC<{
  organizations: Organization[]; selectedOrg: Organization; rooms: Room[]; onBack: () => void;
  onSuccess: (receipt: { roomName: string; date: string; time: string; id: number }) => void;
}> = ({ organizations, selectedOrg, rooms, onBack, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState(selectedOrg);
  const [roomPool, setRoomPool] = useState<Room[]>(rooms);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [retryIndex, setRetryIndex] = useState(0);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const bookingKey = useRef(newKey());
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i); return d;
  }), []);
  const day = dates[dateOffset];
  const dayString = dateKey(day);

  useEffect(() => {
    if (step < 2 || !room) return;
    let live = true;
    setLoadingSlots(true); setSlotError(''); setSlots([]); setSlot(null);
    fetchAvailability(org.id, room.id, dayString)
      .then(data => { if (live) setSlots(data.slots); })
      .catch((e: Error) => { if (live) setSlotError(e.message || 'Không tải được lịch còn chỗ.'); })
      .finally(() => { if (live) setLoadingSlots(false); });
    return () => { live = false; };
  }, [step >= 2, org.id, room?.id, dayString, retryIndex]);
  useEffect(() => { bookingKey.current = newKey(); setSubmitError(''); }, [org.id, room?.id, dayString, slot?.id]);
  const chooseOrg = async (item: Organization) => {
    setOrg(item); setRoom(null); setRoomPool([]); setSlot(null);
    if (item.id === selectedOrg.id) { setRoomPool(rooms); return; }
    setLoadingRooms(true);
    try { setRoomPool(await fetchRooms(item.id)); }
    catch (e: any) { setSlotError(e?.message || 'Không tải được phòng.'); }
    finally { setLoadingRooms(false); }
  };
  const next = () => {
    if (step === 1 && !room) return;
    if (step === 2 && (!slot || slot.status !== 'OPEN')) return;
    setStep(Math.min(3, step + 1));
  };
  const back = () => step ? setStep(step - 1) : onBack();
  const confirm = async () => {
    if (!room || !slot || submitting) return;
    setSubmitting(true); setSubmitError('');
    try {
      const receipt = await bookShift({ organization_id: org.id, room_id: room.id, slot_id: slot.id, date: dayString }, bookingKey.current);
      if (receipt.status !== 'BOOKED') throw new Error('Máy chủ chưa xác nhận đặt ca.');
      onSuccess({ roomName: room.name, date: day.toLocaleDateString('vi-VN'),
        time: `${slot.label} · ${slot.starts_at}–${slot.ends_at}`, id: receipt.id });
    } catch (e: any) { setSubmitError(e?.message || 'Không đăng ký được ca. Kiểm tra mạng và thử lại.'); }
    finally { setSubmitting(false); }
  };

  return <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HeaderBack eyebrow={`BƯỚC ${step + 1} / 4`} title="Đăng ký ca trực" onBack={back}/>
      <View style={styles.steps}>{['Tổ chức', 'Phòng trực', 'Ca trực', 'Xác nhận'].map((label, i) =>
        <View key={label} style={styles.step}><View style={[styles.stepBadge, i < step && styles.stepDone, i === step && styles.stepCurrent]}>
          {i < step ? <Check size={14} color={palette.white}/> : <Text style={[styles.stepNum, i < step && { color: palette.white }, i === step && { color: palette.blue }]}>{i + 1}</Text>}
        </View><Text style={[styles.stepLabel, i === step && { color: palette.ink, fontWeight: '800' }]}>{label}</Text></View>
      )}</View>
      {step === 0 && <><Text style={styles.title}>Chọn tổ chức</Text><Text style={styles.sub}>Bạn muốn trực cho tổ chức nào?</Text>
        {organizations.map(item => <TouchableOpacity key={item.id} onPress={() => chooseOrg(item)} style={[styles.choice, org.id === item.id && styles.selected]}>
          <View style={styles.orgIcon}><Text style={{ color: palette.blue, fontSize: 20, fontWeight: '900' }}>{item.name[0]}</Text></View>
          <View style={styles.middle}><SmallLabel>ORG #{item.id} · {item.slug.toUpperCase()}</SmallLabel><Text style={styles.choiceTitle}>{item.name}</Text>
            <Text style={textStyles.muted}>{item.description || 'Tổ chức của bạn'}</Text></View>
          {org.id === item.id ? <CheckCircle2 color={palette.blue} size={22}/> : <Circle color={palette.line} size={22}/>}</TouchableOpacity>)}
      </>}
      {step === 1 && <><Text style={styles.title}>Chọn phòng và ngày</Text><Text style={styles.sub}>Chọn phòng và ngày bạn muốn đăng ký.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
          {dates.map((d, i) => <TouchableOpacity onPress={() => { setDateOffset(i); setSlot(null); }} key={i} style={[styles.day, i === dateOffset && styles.dayActive]}>
            <Text style={[styles.dayWeek, i === dateOffset && styles.activeText]}>{i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' })}</Text>
            <Text style={[styles.dayNum, i === dateOffset && styles.activeText]}>{d.getDate()}</Text></TouchableOpacity>)}
        </ScrollView><Text style={styles.dateHeader}>{day.toLocaleDateString('vi-VN')}</Text>
        {roomPool.map(item => <TouchableOpacity key={item.id} style={[styles.choice, room?.id === item.id && styles.selected]} onPress={() => { setRoom(item); setSlot(null); }}>
          <View style={styles.middle}><SmallLabel>{item.campus.toUpperCase()} · P.{roomShort(item)}</SmallLabel><Text style={styles.choiceTitle}>{item.name}</Text>
            <Chip title={`Sức chứa phòng: ${item.capacity}`} tone="gray"/></View>
          {room?.id === item.id ? <CheckCircle2 color={palette.blue} size={22}/> : <Circle color={palette.line} size={22}/>}</TouchableOpacity>)}
        {loadingRooms && <Text style={textStyles.muted}>Đang tải phòng…</Text>}
        {!loadingRooms && !roomPool.length && <Card><Text style={textStyles.muted}>Không có phòng để đăng ký. Vui lòng quay lại hoặc thử lại sau.</Text></Card>}
      </>}
      {step === 2 && <><Text style={styles.title}>Chọn ca trực</Text><Text style={styles.sub}>Số chỗ trống được lấy trực tiếp từ máy chủ.</Text>
        {loadingSlots && <Card><Text style={textStyles.muted}>Đang kiểm tra chỗ trống…</Text></Card>}
        {!loadingSlots && !!slotError && <Card><Text style={styles.error}>{slotError}</Text><ActionButton title="Thử tải lại" outline onPress={() => setRetryIndex(i => i + 1)}/></Card>}
        {!loadingSlots && !slotError && !slots.length && <Card><Text style={textStyles.muted}>Ngày này chưa được quản trị viên mở ca. Vui lòng chọn ngày/phòng khác.</Text></Card>}
        {slots.map(item => <TouchableOpacity key={item.id} disabled={item.status !== 'OPEN'} style={[styles.choice, slot?.id === item.id && styles.selected, item.status !== 'OPEN' && styles.disabled]} onPress={() => setSlot(item)}>
          <View style={styles.middle}><Text style={styles.choiceTitle}>{item.label} · {item.starts_at}–{item.ends_at}</Text>
            <Chip tone={item.status === 'OPEN' ? 'green' : 'gray'} title={item.status === 'OPEN' ? `Còn ${item.remaining}/${item.capacity} chỗ` : item.status === 'FULL' ? 'Đã đầy' : 'Đã bắt đầu'}/></View>
          {slot?.id === item.id ? <CheckCircle2 color={palette.blue} size={22}/> : <Circle color={palette.line} size={22}/>}</TouchableOpacity>)}
      </>}
      {step === 3 && <><Text style={styles.title}>Xác nhận đăng ký</Text><Text style={styles.sub}>Thông tin này sẽ được lưu vào hệ thống khi bạn xác nhận.</Text>
        <Card><SmallLabel>{org.name.toUpperCase()}</SmallLabel><Text style={[styles.title, { fontSize: 19, marginTop: 10 }]}>{room?.name}</Text>
          <Text style={[textStyles.muted, { marginBottom: 16 }]}>P.{room ? roomShort(room) : '—'} · {room?.campus}</Text>
          <View style={styles.separator}/><View style={styles.summaryRow}><CalendarDays color={palette.muted} size={17}/><Text style={styles.summaryText}>{day.toLocaleDateString('vi-VN')}</Text>
          <Clock3 color={palette.muted} size={17}/><Text style={styles.summaryText}>{slot?.starts_at}–{slot?.ends_at}</Text></View></Card>
        <View style={styles.notice}><Info size={20} color={palette.blue}/><Text style={styles.noticeText}>Một người không thể đặt các khung giờ trùng nhau. Nếu hết chỗ, máy chủ sẽ từ chối giao dịch.</Text></View>
        {!!submitError && <Text accessibilityRole="alert" style={styles.error}>{submitError}</Text>}
      </>}
    </ScrollView>
    <View style={styles.bottom}><ActionButton title={step === 3 ? (submitting ? 'Đang xác nhận…' : 'Xác nhận đăng ký') : 'Tiếp tục'}
      onPress={step === 3 ? confirm : next}
      disabled={submitting || loadingRooms || loadingSlots || (step === 1 && !room) || (step === 2 && (!slot || slot.status !== 'OPEN'))}/></View>
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
  disabled: { opacity: .5 }, selected: { borderColor: '#A7C2FF', backgroundColor: '#FCFDFF' },
  orgIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.blueWash },
  middle: { flex: 1, gap: 5 }, choiceTitle: { color: palette.ink, fontWeight: '800', fontSize: 14, marginVertical: 4 },
  day: { width: 62, height: 68, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: palette.blue, borderColor: palette.blue }, dayWeek: { fontSize: 11, color: palette.muted }, dayNum: { fontSize: 21, fontWeight: '900', color: palette.ink }, activeText: { color: palette.white },
  dateHeader: { marginBottom: 13, fontWeight: '800', color: palette.ink },
  separator: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: palette.line, marginBottom: 17 },
  summaryRow: { flexDirection: 'row', gap: 9, alignItems: 'center', flexWrap: 'wrap' }, summaryText: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.blueWash, borderRadius: 16, padding: 15, marginTop: 16 },
  noticeText: { flex: 1, color: palette.blueDark, fontSize: 12, lineHeight: 19 },
  error: { backgroundColor: palette.redWash, color: palette.red, padding: 12, borderRadius: 12, marginVertical: 8 },
  bottom: { padding: 16, backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.line },
});
