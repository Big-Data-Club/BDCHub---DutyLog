import React, { useEffect, useState } from 'react';
import { registerRootComponent } from 'expo';
import { View } from 'react-native';
import { HomeScreen } from '../src/screens/v2/HomeScreen';
import { RoomPickerScreen } from '../src/screens/v2/RoomPickerScreen';
import { ShiftsScreen } from '../src/screens/v2/ShiftsScreen';
import { ActivityScreen } from '../src/screens/v2/ActivityScreen';
import { ProfileScreen } from '../src/screens/v2/ProfileScreen';
import { RegistrationScreen } from '../src/screens/v2/RegistrationScreen';
import { RegistrationSuccessScreen } from '../src/screens/v2/RegistrationSuccessScreen';
import { ScanCheckinScreen } from '../src/screens/ScanCheckinScreen';
import { QRDisplayScreen } from '../src/screens/QRDisplayScreen';
import { OrgSelectionScreen } from '../src/screens/OrgSelectionScreen';
import { DutyStationScreen } from '../src/screens/DutyStationScreen';
import { Page, Tabs, type TabId } from '../src/ui/Kit';
import { demoOrg, demoRooms, demoUser, resetDemo, setDemoOffline } from './fixtures';

type Route = 'APP' | 'PICKER' | 'SCAN' | 'QR' | 'REGISTER' | 'SUCCESS' | 'ORG' | 'STATION';
function DemoApp() {
  const [route, setRoute] = useState<Route>('APP');
  const [tab, setTab] = useState<TabId>('HOME');
  const [room, setRoom] = useState(demoRooms[0]);
  const [revision, setRevision] = useState(0);
  const [receipt, setReceipt] = useState({ roomName: '', date: '', time: '', id: 0 });
  const home = () => { setRoute('APP'); setTab('HOME'); setRevision(v => v + 1); };
  useEffect(() => {
    const listen = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.type !== 'dutylog:command') return;
      if (event.data.action === 'hello') window.parent.postMessage({ type: 'dutylog:ready' }, window.location.origin);
      if (event.data.action === 'reset') { resetDemo(); setRoom(demoRooms[0]); home(); }
      if (event.data.action === 'home') home();
      if (event.data.action === 'rooms') setRoute('PICKER');
      if (event.data.action === 'scan') setRoute('SCAN');
      if (event.data.action === 'qr') setRoute('QR');
      if (event.data.action === 'shifts') { setRoute('APP'); setTab('SHIFTS'); }
      if (event.data.action === 'offline') setDemoOffline(event.data.value === true);
    };
    window.addEventListener('message', listen);
    window.parent.postMessage({ type: 'dutylog:ready' }, window.location.origin);
    return () => window.removeEventListener('message', listen);
  }, []);
  useEffect(() => { window.parent.postMessage({ type: 'dutylog:screen', screen: route === 'APP' ? tab.toLowerCase() : route.toLowerCase() }, window.location.origin); }, [route, tab]);
  const register = () => setRoute('REGISTER');
  const qr = () => setRoute('QR');
  const picker = () => setRoute('PICKER');
  const changeTab = (next: TabId) => next === 'SCAN' ? setRoute('SCAN') : setTab(next);
  return <View style={{ flex: 1, backgroundColor: '#F2F4F8' }}>
    {route === 'APP' && <Page scroll={false} footer={<Tabs active={tab} navigate={changeTab} />}>
      {tab === 'HOME' && <HomeScreen key={revision} user={demoUser} organization={demoOrg} rooms={demoRooms} selectedRoom={room} onSelectRoom={picker} onRegister={register} onScan={() => setRoute('SCAN')} onQR={qr} onShifts={() => setTab('SHIFTS')} onActivity={() => setTab('ACTIVITY')} onProfile={() => setTab('PROFILE')} />}
      {tab === 'SHIFTS' && <ShiftsScreen user={demoUser} rooms={demoRooms} onRegister={register} onSelectRoom={picker} />}
      {tab === 'ACTIVITY' && <ActivityScreen user={demoUser} rooms={demoRooms} />}
      {tab === 'PROFILE' && <ProfileScreen user={demoUser} organization={demoOrg} onQR={qr} onShifts={() => setTab('SHIFTS')} onOrg={() => setRoute('ORG')} onLogout={() => { resetDemo(); home(); }} onLegacy={() => setRoute('STATION')} onAdmin={picker} />}
    </Page>}
    {route === 'PICKER' && <Page scroll={false}><RoomPickerScreen rooms={demoRooms} selectedRoom={room} onBack={home} onSelect={selected => { setRoom(selected); home(); }} /></Page>}
    {route === 'SCAN' && <ScanCheckinScreen room={room} onBack={home} onSuccess={() => setRevision(v => v + 1)} />}
    {route === 'QR' && <QRDisplayScreen user={demoUser} room={room} onBack={home} />}
    {route === 'ORG' && <OrgSelectionScreen user={demoUser} organizations={[demoOrg]} onSelectOrg={home} onLogout={home} />}
    {route === 'STATION' && <DutyStationScreen user={demoUser} organization={demoOrg} room={room} onBackToRooms={picker} onOpenScanner={() => setRoute('SCAN')} onOpenPersonalQR={qr} onLogout={home} />}
    {route === 'REGISTER' && <Page scroll={false}><RegistrationScreen organizations={[demoOrg]} selectedOrg={demoOrg} rooms={demoRooms} onBack={home} onSuccess={saved => { setReceipt(saved); setRoute('SUCCESS'); }} /></Page>}
    {route === 'SUCCESS' && <Page scroll={false}><RegistrationSuccessScreen {...receipt} onHome={() => { setRoute('APP'); setTab('SHIFTS'); }} onAgain={register} /></Page>}
  </View>;
}
registerRootComponent(DemoApp);
