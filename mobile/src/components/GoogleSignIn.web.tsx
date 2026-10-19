import React, { useEffect, useRef, useState } from 'react';
import type { GoogleSignInProps } from './GoogleSignIn';

interface GoogleIdentity {
  initialize: (options: { client_id: string; callback: (result: { credential?: string }) => void; auto_select: boolean }) => void;
  renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
}
declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } } }
}

let loading: Promise<GoogleIdentity> | undefined;
function loadGoogle(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (!loading) {
    loading = new Promise<GoogleIdentity>((resolve, reject) => {
      const script = document.createElement('script');
      const timer = window.setTimeout(fail, 15000);
      function fail() {
        window.clearTimeout(timer);
        script.remove();
        reject(new Error('Không tải được Google Sign-in. Kiểm tra kết nối rồi tải lại trang.'));
      }
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        window.clearTimeout(timer);
        if (window.google?.accounts.id) resolve(window.google.accounts.id);
        else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    }).catch(error => { loading = undefined; throw error; });
  }
  return loading;
}

export default function GoogleSignIn(props: GoogleSignInProps) {
  const container = useRef<HTMLDivElement>(null);
  const handlers = useRef(props);
  handlers.current = props;
  const [ready, setReady] = useState(false);
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  useEffect(() => {
    if (!clientId) return;
    let active = true;
    loadGoogle().then(google => {
      if (!active || !container.current) return;
      google.initialize({ client_id: clientId, auto_select: false, callback: result => {
        if (!active || handlers.current.disabled) return;
        if (result.credential) handlers.current.onCredential(result.credential);
        else handlers.current.onError('Không nhận được thông tin đăng nhập từ Google.');
      } });
      google.renderButton(container.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', locale: 'vi',
        width: Math.min(400, container.current.clientWidth || 280),
      });
      setReady(true);
    }).catch(error => { if (active) handlers.current.onError(error.message); });
    return () => { active = false; };
  }, [clientId]);
  if (!clientId) return <p role="status">Đăng nhập Google chưa được cấu hình.</p>;
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    {!ready && <span>Đang tải Google Sign-in…</span>}
    <div ref={container}  aria-disabled={props.disabled}
      style={{ width: '100%', minHeight: 44, pointerEvents: props.disabled ? 'none' : 'auto', visibility: props.disabled ? 'hidden' : 'visible' }} />
  </div>;
}
