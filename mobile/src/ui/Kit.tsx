import React from 'react';
import {
  ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, type StyleProp, type ViewStyle,
} from 'react-native';
import { CalendarDays, ClipboardList, ScanLine, UserRound, Home, ChevronLeft, Inbox } from 'lucide-react-native';
import { palette, spacing } from './theme';

export function Page({ children, scroll = true, footer, style }: {
  children: React.ReactNode; scroll?: boolean; footer?: React.ReactNode; style?: StyleProp<ViewStyle>;
}) {
  return <SafeAreaView style={styles.safe}>
    {scroll ? <ScrollView style={styles.flex} contentContainerStyle={[styles.body, style]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
      : <View style={[styles.flex, style]}>{children}</View>}
    {footer}
  </SafeAreaView>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function ActionButton({ title, onPress, disabled, icon, outline = false, danger = false, compact = false }: {
  title: string; onPress: () => void; disabled?: boolean; icon?: React.ReactNode;
  outline?: boolean; danger?: boolean; compact?: boolean;
}) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
    onPress={onPress} disabled={disabled} activeOpacity={0.82} style={[
      styles.button, outline && styles.outlineButton, danger && styles.dangerButton,
      disabled && styles.disabledButton, compact && styles.compactButton,
    ]}>
    {icon}{<Text style={[styles.buttonText, (outline || danger) && styles.outlineText, danger && { color: palette.red }, disabled && { color: palette.faint }]}>{title}</Text>}
  </TouchableOpacity>;
}
export function Heading({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return <View style={styles.heading}><Text style={styles.headingText}>{title}</Text>
    {link && onLink && <TouchableOpacity onPress={onLink}><Text style={styles.link}>{link}</Text></TouchableOpacity>}</View>;
}
export function SmallLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.smallLabel}>{children}</Text>;
}
export function Chip({ title, tone = 'blue' }: { title: string; tone?: 'blue' | 'green' | 'orange' | 'red' | 'gray' }) {
  const bg = { blue: palette.blueWash, green: palette.greenWash, orange: palette.orangeWash, red: palette.redWash, gray: palette.bg }[tone];
  const fg = { blue: palette.blue, green: palette.green, orange: '#B66C00', red: palette.red, gray: palette.muted }[tone];
  return <View style={[styles.chip, { backgroundColor: bg }]}><Text style={[styles.chipText, { color: fg }]}>{title}</Text></View>;
}
export function Empty({ title, description }: { title: string; description: string }) {
  return <View style={styles.empty}><Inbox size={30} color={palette.faint} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptySubtitle}>{description}</Text></View>;
}
export function HeaderBack({ title, eyebrow, onBack }: { title: string; eyebrow?: string; onBack: () => void }) {
  return <View style={styles.headerBack}><TouchableOpacity onPress={onBack} style={styles.back} accessibilityLabel="Quay lại"><ChevronLeft size={23} color={palette.ink} /></TouchableOpacity>
    <View><Text style={styles.headerEyebrow}>{eyebrow}</Text><Text style={styles.headerTitle}>{title}</Text></View></View>;
}
export function Spinner({ text = 'Đang tải dữ liệu…' }: { text?: string }) {
  return <View style={styles.spinner}><ActivityIndicator color={palette.blue} /><Text style={styles.muted}>{text}</Text></View>;
}
export type TabId = 'HOME' | 'SHIFTS' | 'SCAN' | 'ACTIVITY' | 'PROFILE';
const tabItems = [
  { id: 'HOME', title: 'Trang chủ', Icon: Home },
  { id: 'SHIFTS', title: 'Ca trực', Icon: CalendarDays },
  { id: 'SCAN', title: 'Quét', Icon: ScanLine },
  { id: 'ACTIVITY', title: 'Hoạt động', Icon: ClipboardList },
  { id: 'PROFILE', title: 'Cá nhân', Icon: UserRound },
] as const;
export function Tabs({ active, navigate }: { active: TabId; navigate: (id: TabId) => void }) {
  return <View style={styles.tabs}>{tabItems.map(({ id, title, Icon }) => {
    const selected = id === active;
    const raised = id === 'SCAN';
    return <TouchableOpacity key={id} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => navigate(id)}>
      <View style={raised ? styles.raised : styles.tabIcon}><Icon size={raised ? 28 : 21} color={raised ? palette.white : selected ? palette.blue : palette.faint} strokeWidth={selected ? 2.4 : 1.9}/></View>
      <Text style={[styles.tabText, selected && styles.tabTextActive]}>{title}</Text>
    </TouchableOpacity>;
  })}</View>;
}
export const textStyles = StyleSheet.create({ title: { color: palette.ink, fontSize: 24, fontWeight: '800' }, body: { color: palette.ink, fontSize: 14, fontWeight: '600' }, muted: { color: palette.muted, fontSize: 13, lineHeight: 19 }, headline: { color: palette.ink, fontSize: 17, fontWeight: '800' } });
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: palette.bg, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  body: { paddingHorizontal: spacing.page, paddingTop: 14, paddingBottom: 30, flexGrow: 1 },
  card: { backgroundColor: palette.white, borderRadius: spacing.radius, padding: spacing.card },
  button: { backgroundColor: palette.blue, minHeight: 48, borderRadius: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  compactButton: { minHeight: 42 },
  buttonText: { color: palette.white, fontSize: 14, fontWeight: '800' },
  outlineButton: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white },
  outlineText: { color: palette.blue },
  dangerButton: { backgroundColor: palette.white, borderWidth: 1, borderColor: '#FFC4C9' },
  disabledButton: { backgroundColor: '#EFF3F8', borderColor: '#EFF3F8' },
  heading: { marginBottom: 14, marginTop: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headingText: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  link: { color: palette.blue, fontSize: 12, fontWeight: '700' },
  smallLabel: { color: palette.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, alignSelf: 'flex-start' },
  chipText: { fontSize: 10, fontWeight: '800' },
  empty: { minHeight: 138, justifyContent: 'center', alignItems: 'center', padding: 14, gap: 6 },
  emptyTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  emptySubtitle: { color: palette.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  headerBack: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 22 },
  back: { width: 42, height: 42, borderRadius: 22, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { color: palette.blue, fontWeight: '800', fontSize: 10, letterSpacing: 1.2 },
  headerTitle: { color: palette.ink, fontWeight: '800', fontSize: 19 },
  spinner: { alignItems: 'center', padding: 28, gap: 9 }, muted: { color: palette.muted, fontSize: 12 },
  tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 76, backgroundColor: palette.white, borderTopColor: palette.line, borderTopWidth: 1, paddingHorizontal: 7 },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  tabIcon: { height: 32, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 10, color: palette.faint, fontWeight: '600' },
  tabTextActive: { color: palette.blue, fontWeight: '800' },
  raised: { width: 53, height: 53, marginTop: -30, marginBottom: 0, borderRadius: 28, backgroundColor: palette.blue, borderWidth: 3, borderColor: palette.white, alignItems: 'center', justifyContent: 'center' },
});
