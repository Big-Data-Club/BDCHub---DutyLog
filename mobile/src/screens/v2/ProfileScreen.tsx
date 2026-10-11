import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, Building2, History, LogOut, QrCode, Repeat2, UserRound } from 'lucide-react-native';
import type { Organization, User } from '../../types';
import { Card, Chip, textStyles } from '../../ui/Kit';
import { palette } from '../../ui/theme';
export const ProfileScreen: React.FC<{
  user: User; organization: Organization; onQR: () => void; onShifts: () => void; onOrg: () => void;
  onLogout: () => void; onLegacy: () => void; onAdmin: () => void;
}> = ({ user, organization, onQR, onShifts, onOrg, onLogout, onLegacy, onAdmin }) => {
  const letters = user.name.split(/\s+/).filter(Boolean).slice(-2).map(s => s.charAt(0)).join('').toUpperCase() || 'BDC';
  const logout = () => Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để sử dụng DutyLog.', [
    { text: 'Hủy', style: 'cancel' }, { text: 'Đăng xuất', style: 'destructive', onPress: onLogout },
  ]);
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.profileHeader}><View style={styles.avatar}><Text style={styles.initials}>{letters}</Text></View>
      <View style={{ flex: 1 }}><Text style={styles.name}>{user.name}</Text><Text style={styles.email}>{user.email}</Text>
        <Chip title={user.is_super_admin ? 'Quản trị' : 'Thành viên'} /><Text style={[styles.email, { marginTop: 9 }]}>{organization.name}</Text></View></View>
    <TouchableOpacity onPress={onQR}><Card style={styles.qrCard}><View style={styles.tile}><QrCode color={palette.blue} size={28}/></View>
      <View style={{ flex: 1 }}><Text style={styles.itemTitle}>Mã QR của tôi</Text><Text style={styles.sub}>Dùng khi quên thẻ sinh viên</Text></View></Card></TouchableOpacity>
    <Card style={{ paddingVertical: 0, paddingHorizontal: 0 }}>
      <Item Icon={History} title="Lịch sử ca trực" subtitle="Xem thời gian bắt đầu và kết thúc" onPress={onShifts}/>
      <Item Icon={Bell} title="Thông báo" subtitle="Nhắc ca, kết quả đăng ký" onPress={() => Alert.alert('Thông báo', 'Danh sách thông báo đang chờ tích hợp API và thiết bị nhận push notification.')}/>
      <Item Icon={Repeat2} title="Đổi tổ chức" subtitle={`Đang chọn: ${organization.name}`} onPress={onOrg}/>
      <Item Icon={Building2} title="Giao diện quản lý phòng hiện tại" subtitle="Giữ lại các chức năng đang hoạt động" onPress={onLegacy}/>
      {user.is_super_admin ? <Item Icon={UserRound} title="Kiểm tra hệ thống (Admin)" subtitle="Xem tổ chức, phòng và lịch sử" onPress={onAdmin}/> : null}
      <Item Icon={LogOut} title="Đăng xuất" subtitle="" onPress={logout} red/>
    </Card><Text style={styles.version}>DutyLog 1.0 · Big Data Club</Text>
  </ScrollView>;
};
function Item({ Icon, title, subtitle, onPress, red = false }: { Icon: React.ComponentType<any>; title: string; subtitle: string; onPress: () => void; red?: boolean }) {
  return <TouchableOpacity style={styles.item} onPress={onPress}><View style={[styles.itemIcon, red && { backgroundColor: palette.redWash }]}><Icon size={19} color={red ? palette.red : palette.blue}/></View>
    <View style={{ flex: 1 }}><Text style={[styles.itemTitle, red && { color: palette.red }]}>{title}</Text>{subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}</View></TouchableOpacity>;
}
const styles = StyleSheet.create({ content: { paddingHorizontal: 18, paddingTop: 42, paddingBottom: 36 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 27 },
  avatar: { width: 65, height: 65, borderRadius: 34, backgroundColor: palette.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: palette.white },
  initials: { color: palette.white, fontSize: 22, fontWeight: '900' }, name: { color: palette.ink, fontSize: 20, fontWeight: '900' },
  email: { color: palette.muted, fontSize: 12, marginTop: 4, marginBottom: 8 },
  qrCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#BFD2FF', marginBottom: 18, paddingVertical: 17 },
  tile: { width: 52, height: 52, borderRadius: 16, backgroundColor: palette.blueWash, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', gap: 13, minHeight: 62, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: palette.line },
  itemIcon: { width: 42, height: 42, borderRadius: 24, backgroundColor: palette.blueWash, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' }, sub: { color: palette.muted, fontSize: 11, marginTop: 5 },
  version: { textAlign: 'center', color: palette.muted, fontSize: 11, marginTop: 20 },
});
