import React from 'react';
import { Text } from 'react-native';

export interface GoogleSignInProps {
  disabled: boolean;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}

export default function GoogleSignIn(_props: GoogleSignInProps) {
  return <Text>Đăng nhập Google hiện hỗ trợ trên DutyLog Web. Trên ứng dụng, hãy dùng tài khoản và mật khẩu.</Text>;
}
