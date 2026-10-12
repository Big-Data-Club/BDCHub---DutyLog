import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Organization, Room, User } from './src/types';
import { clearSession, fetchRooms, fetchUserOrganizations, restoreSession, setCurrentUser } from './src/api/client';
import { LoginScreen } from './src/screens/LoginScreen';
import { OrgSelectionScreen } from './src/screens/OrgSelectionScreen';
import { DutyStationScreen } from './src/screens/DutyStationScreen';
import { ScanCheckinScreen } from './src/screens/ScanCheckinScreen';
import { QRDisplayScreen } from './src/screens/QRDisplayScreen';
import { AdminInspectionScreen } from './src/screens/AdminInspectionScreen';
import { HomeScreen } from './src/screens/v2/HomeScreen';
import { RegistrationScreen } from './src/screens/v2/RegistrationScreen';
import { RegistrationSuccessScreen } from './src/screens/v2/RegistrationSuccessScreen';
import { RoomPickerScreen } from './src/screens/v2/RoomPickerScreen';
import { ShiftsScreen } from './src/screens/v2/ShiftsScreen';
import { ActivityScreen } from './src/screens/v2/ActivityScreen';
import { ProfileScreen } from './src/screens/v2/ProfileScreen';
import { Page, Tabs, type TabId } from './src/ui/Kit';
import { palette } from './src/ui/theme';

type Route = 'LOGIN' | 'APP' | 'ORG_SELECT' | 'REGISTER' | 'REGISTER_SUCCESS' | 'PICKER' | 'SCAN' | 'QR_DISPLAY' | 'LEGACY_STATION' | 'ADMIN_INSPECTION';
export default function App() {
  const [route, setRoute] = useState<Route>('LOGIN');
  const [tab, setTab] = useState<TabId>('HOME');
  const [user, setUser] = useState<User | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ roomName: string; date: string; time: string; id: number } | null>(null);
  const [scanMode, setScanMode] = useState<'BARCODE' | 'QR_SCAN'>('BARCODE');

  const chooseOrg = useCallback(async (target: Organization) => {
    setBusy(true);
    try {
      const loaded = await fetchRooms(target.id);
      setOrg(target);
      setRooms(loaded);
      setRoom(prev => loaded.find(r => r.id === prev?.id) || loaded[0] || null);
      setTab('HOME');
      setRoute('APP');
    } catch (e: any) {
      Alert.alert('Không tải được phòng', e?.message || 'Kiểm tra kết nối và thử lại.');
    } finally { setBusy(false); }
  }, []);
  const loadSession = useCallback(async (signedIn: User) => {
    setUser(signedIn);
    setBusy(true);
    try {
      const response = await fetchUserOrganizations();
      const list = response.organizations || [];
      setOrgs(list);
      if (list.length === 1) await chooseOrg(list[0]);
      else setRoute('ORG_SELECT');
    } catch (e: any) {
      setRoute('ORG_SELECT');
      Alert.alert('Không tải được tổ chức', e?.message || 'Hãy thử lại sau.');
    } finally { setBusy(false); }
  }, [chooseOrg]);
  useEffect(() => {
    let mounted = true;
    (async () => { try { const restored = await restoreSession(); if (mounted && restored) await loadSession(restored); }
      catch (e) { console.warn('Restore session failed:', e); }
      finally { if (mounted) setRestoring(false); }
    })();
    return () => { mounted = false; };
  }, [loadSession]);
  const refreshRooms = useCallback(async () => {
    if (!org) return;
    try {
      const next = await fetchRooms(org.id);
      setRooms(next);
      setRoom(old => next.find(x => x.id === old?.id) || next[0] || null);
    } catch (e) { console.warn('Reload rooms failed', e); }
  }, [org?.id]);
  const logout = async () => {
    await clearSession(); setCurrentUser(null);
    setUser(null); setOrg(null); setOrgs([]); setRooms([]); setRoom(null);
    setTab('HOME'); setRoute('LOGIN');
  };
  const openScan = (mode: 'BARCODE' | 'QR_SCAN' = 'BARCODE') => {
    if (!room) { Alert.alert('Chưa chọn phòng', 'Hãy chọn phòng trước khi quét điểm danh.'); setRoute('PICKER'); return; }
    setScanMode(mode); setRoute('SCAN');
  };
  const openQR = () => {
    if (!room) { setRoute('PICKER'); return; }
    setRoute('QR_DISPLAY');
  };
  const changeTab = (next: TabId) => next === 'SCAN' ? openScan() : setTab(next);
  const goBack = () => {
    if (route === 'APP') { if (tab !== 'HOME') { setTab('HOME'); return true; } return false; }
    if (route === 'LOGIN') return false;
    if (route === 'ORG_SELECT') { if (org) { setRoute('APP'); return true; } return false; }
    if (route === 'ADMIN_INSPECTION' || route === 'LEGACY_STATION' || route === 'QR_DISPLAY' || route === 'SCAN') refreshRooms();
    setRoute('APP');
    return true;
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [route, tab, org, room]);

  if (restoring) return <View style={styles.splash}><StatusBar style="dark"/>
    <Image source={require('./assets/bdclogo.png')} resizeMode="contain" style={{ width: 96, height: 86 }}/>
    <Text style={styles.splashTitle}>Duty<Text style={{ color: palette.blue }}>Log</Text></Text>
    <ActivityIndicator color={palette.blue} style={{ marginTop: 20 }}/>
    <Text style={styles.splashNote}>Đang khôi phục phiên làm việc…</Text>
  </View>;
  return <View style={styles.root}><StatusBar style={route === 'SCAN' ? 'light' : 'dark'} />
    {route === 'LOGIN' && <LoginScreen onLoginSuccess={loadSession}/>}
    {route === 'ORG_SELECT' && user && <OrgSelectionScreen user={user} organizations={orgs}
      onSelectOrg={chooseOrg} onLogout={logout} onNavigateToInspection={() => setRoute('ADMIN_INSPECTION')}/>}
    {route === 'APP' && user && org && <Page scroll={false} footer={<Tabs active={tab} navigate={changeTab}/> }>
      {tab === 'HOME' && <HomeScreen user={user} organization={org} rooms={rooms} selectedRoom={room}
        onSelectRoom={() => setRoute('PICKER')} onRegister={() => setRoute('REGISTER')} onScan={() => openScan()} onQR={openQR}
        onShifts={() => setTab('SHIFTS')} onActivity={() => setTab('ACTIVITY')} onProfile={() => setTab('PROFILE')}/>}
      {tab === 'SHIFTS' && <ShiftsScreen user={user} rooms={rooms} onRegister={() => setRoute('REGISTER')} onSelectRoom={() => setRoute('PICKER')}/>}
      {tab === 'ACTIVITY' && <ActivityScreen user={user} rooms={rooms}/>}
      {tab === 'PROFILE' && <ProfileScreen user={user} organization={org} onQR={openQR} onShifts={() => setTab('SHIFTS')}
        onOrg={() => setRoute('ORG_SELECT')} onLogout={logout} onLegacy={() => room ? setRoute('LEGACY_STATION') : setRoute('PICKER')}
        onAdmin={() => setRoute('ADMIN_INSPECTION')}/>}
    </Page>}
    {route === 'REGISTER' && org && <Page scroll={false}><RegistrationScreen organizations={orgs} selectedOrg={org} rooms={rooms} onBack={() => setRoute('APP')} onSuccess={saved => { setReceipt(saved); setRoute('REGISTER_SUCCESS'); }}/></Page>}
    {route === 'REGISTER_SUCCESS' && receipt && <Page scroll={false}><RegistrationSuccessScreen roomName={receipt.roomName} date={receipt.date} time={receipt.time} onHome={() => { setTab('SHIFTS'); setRoute('APP'); }} onAgain={() => setRoute('REGISTER')}/></Page>}
    {route === 'PICKER' && <Page scroll={false}><RoomPickerScreen rooms={rooms} selectedRoom={room} onBack={() => setRoute('APP')}
      onSelect={selected => { setRoom(selected); setRoute('APP'); }}/></Page>}
    {route === 'SCAN' && room && <ScanCheckinScreen room={room} initialMode={scanMode}
      onBack={() => { refreshRooms(); setRoute('APP'); }} onSuccess={refreshRooms}/>}
    {route === 'QR_DISPLAY' && room && <QRDisplayScreen user={user || undefined} room={room}
      onBack={() => { refreshRooms(); setRoute('APP'); }}/>}
    {route === 'LEGACY_STATION' && user && org && room && <DutyStationScreen user={user} organization={org} room={room}
      onBackToRooms={() => setRoute('PICKER')} onOpenScanner={openScan} onOpenPersonalQR={openQR}
      onLogout={logout} onNavigateToInspection={() => setRoute('ADMIN_INSPECTION')}/>}
    {route === 'ADMIN_INSPECTION' && <AdminInspectionScreen onBack={() => setRoute('APP')}/>}
    {busy && <View style={styles.overlay}><ActivityIndicator color={palette.blue} size="large"/><Text style={styles.busyText}>Đang tải dữ liệu…</Text></View>}
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  splash: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' },
  splashTitle: { color: palette.ink, fontSize: 36, fontWeight: '900' },
  splashNote: { color: palette.muted, marginTop: 15, fontSize: 12 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(242,244,248,.87)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  busyText: { color: palette.muted, marginTop: 12, fontSize: 13 },
});
