import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { ActionButton, Card, SmallLabel } from '../../ui/Kit';
import { palette } from '../../ui/theme';
/** RESERVED: Mount only after the backend returns a successful reservation response.
 * This component intentionally has no connection to the preview registration wizard.
 */
export const RegistrationSuccessScreen: React.FC<{
  roomName: string; date: string; time: string; onHome: () => void; onAgain: () => void;
}> = ({ roomName, date, time, onHome, onAgain }) => <View style={styles.root}>
  <View style={styles.center}><CheckCircle2 size={82} color={palette.green}/><Text style={styles.title}>Đăng ký thành công</Text>
    <Text style={styles.sub}>Ca trực đã được ghi nhận trên hệ thống.</Text>
    <Card style={{ width: '100%', marginTop: 22 }}><SmallLabel>{time}</SmallLabel><Text style={styles.room}>{roomName}</Text><Text style={styles.sub}>{date}</Text></Card></View>
  <View style={styles.footer}><ActionButton title="Về trang chủ" onPress={onHome}/><View style={{ height: 10 }}/>
    <ActionButton title="Đăng ký thêm ca khác" outline onPress={onAgain}/></View></View>;
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: palette.bg, justifyContent: 'space-between' }, center: { alignItems: 'center', padding: 19, paddingTop: 100 }, title: { color: palette.ink, fontSize: 25, fontWeight: '900', marginTop: 25 }, sub: { color: palette.muted, fontSize: 13, marginTop: 7 }, room: { fontWeight: '800', color: palette.ink, fontSize: 17, marginTop: 9 }, footer: { backgroundColor: palette.white, padding: 18 } });
