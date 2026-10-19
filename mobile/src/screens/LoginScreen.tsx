import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react-native';
import { loginWithCredentials, loginWithGoogle } from '../api/client';
import type { User } from '../types';
import { palette } from '../ui/theme';
import { ActionButton } from '../ui/Kit';
import GoogleSignIn from '../components/GoogleSignIn';

interface Props { onLoginSuccess: (user: User) => void }
export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!account.trim() || !password) { setError('Vui lòng nhập tài khoản và mật khẩu.'); return; }
    setBusy(true); setError('');
    try {
      const signedIn = await loginWithCredentials(account.trim(), password);
      onLoginSuccess(signedIn);
    }
    catch (e: any) { setError(e?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.shapeLeft} /><View style={styles.shapeRight} />
      <View style={styles.brand}>
        <Image source={require('../../assets/bdclogo.png')} resizeMode="contain" style={styles.logo} />
        <Text style={styles.brandSubtitle}>BIG DATA CLUB · HCMUT</Text>
        <View style={styles.brandRow}><Text style={styles.brandDuty}>Duty</Text><Text style={styles.brandLog}>Log</Text></View>
        <Text style={styles.brandHint}>Đăng nhập để bắt đầu ca trực</Text>
      </View>
      <View style={styles.form}>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>Tài khoản / Email / MSSV</Text>
        <View style={styles.inputShell}><UserRound size={19} color={palette.muted} /><TextInput style={styles.input}
          autoCapitalize="none" autoCorrect={false} keyboardType="default" placeholder="Nhập tài khoản" placeholderTextColor={palette.faint}
          accessibilityLabel="Tài khoản hoặc email" value={account} onChangeText={setAccount} editable={!busy} /></View>
        <Text style={[styles.label, { marginTop: 19 }]}>Mật khẩu</Text>
        <View style={styles.inputShell}><LockKeyhole size={19} color={palette.muted} /><TextInput style={styles.input}
          secureTextEntry={!visible} placeholder="Nhập mật khẩu" placeholderTextColor={palette.faint} accessibilityLabel="Mật khẩu"
          autoCapitalize="none" value={password} onChangeText={setPassword} editable={!busy} />
          <TouchableOpacity onPress={() => setVisible(!visible)} accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
            {visible ? <EyeOff size={20} color={palette.muted} /> : <Eye size={20} color={palette.muted} />}
          </TouchableOpacity></View>
        <TouchableOpacity style={styles.forgot} onPress={() => Alert.alert('Quên mật khẩu?', 'Vui lòng sử dụng quy trình khôi phục tài khoản của BDC Hub. Màn hình khôi phục riêng đang được xây dựng.') }>
          <Text style={styles.link}>Quên mật khẩu?</Text>
        </TouchableOpacity>
        <ActionButton title={busy ? 'Đang đăng nhập…' : 'Đăng nhập'} disabled={busy} onPress={submit}/>
        {busy ? <ActivityIndicator color={palette.blue} style={{ marginTop: 8 }} /> : null}
        <View style={styles.divider}><View style={styles.line}/><Text style={styles.dividerText}>hoặc</Text><View style={styles.line}/></View>
        <GoogleSignIn disabled={busy} onError={setError} onCredential={async credential => {
          setBusy(true); setError('');
          try { onLoginSuccess(await loginWithGoogle(credential)); }
          catch (e: any) { setError(e?.message || 'Đăng nhập Google thất bại.'); }
          finally { setBusy(false); }
        }} />
        <Text style={styles.signup}>Chưa có tài khoản? Đăng ký tại{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://bdc.hpcc.vn')}>bdc.hpcc.vn</Text></Text>
      </View>
      <View style={styles.footer}><Text style={styles.footerTitle}>HỆ THỐNG TRỰC THUỘC</Text><Text style={styles.footerText}>ĐH Bách Khoa · HPCC · Big Data Club</Text></View>
    </ScrollView>
  </KeyboardAvoidingView>;
};
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 55 : 64, paddingBottom: 24, overflow: 'hidden' },
  shapeLeft: { position: 'absolute', width: 110, height: 110, borderRadius: 90, backgroundColor: '#DBE6FA', left: -44, top: 114 },
  shapeRight: { position: 'absolute', width: 148, height: 148, borderRadius: 90, backgroundColor: '#DBE6FA', right: -35, top: 25 },
  brand: { alignItems: 'center', marginBottom: 38 },
  logo: { width: 110, height: 77, marginBottom: 8 },
  brandSubtitle: { color: palette.muted, letterSpacing: 2, fontWeight: '800', fontSize: 10, marginTop: 4 },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3 },
  brandDuty: { fontSize: 39, fontWeight: '900', color: palette.ink, letterSpacing: -2 },
  brandLog: { fontSize: 39, fontWeight: '900', color: palette.blue, letterSpacing: -2 },
  brandHint: { fontSize: 13, color: palette.muted, marginTop: 8 },
  form: { width: '100%' }, label: { fontSize: 13, fontWeight: '800', color: palette.ink, marginBottom: 8 },
  inputShell: { minHeight: 51, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, minWidth: 0, color: palette.ink, fontSize: 14, paddingVertical: 10 },
  forgot: { alignItems: 'flex-end', paddingVertical: 20 },
  link: { color: palette.blue, fontWeight: '700', fontSize: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 17, gap: 10 },
  line: { height: 1, flex: 1, backgroundColor: palette.line }, dividerText: { color: palette.muted, fontSize: 12 },
  google: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 13, minHeight: 49, justifyContent: 'center' },
  googleIcon: { color: '#F04438', fontWeight: '900', fontSize: 15 }, googleText: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  signup: { color: palette.muted, textAlign: 'center', fontSize: 11, marginTop: 31 },
  footer: { alignItems: 'center', marginTop: 'auto', paddingTop: 40 }, footerTitle: { color: palette.faint, letterSpacing: 1.5, fontSize: 10, fontWeight: '800' }, footerText: { color: palette.muted, fontSize: 10, marginTop: 5 },
  error: { color: palette.red, backgroundColor: palette.redWash, padding: 10, borderRadius: 10, marginBottom: 13, fontSize: 12 },
});
