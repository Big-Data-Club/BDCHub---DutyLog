# 16 · Expo Web on Ubuntu and iPhone XS Max

> **Status:** Developer runbook; same-origin proxy exists in a candidate overlay · **Reviewed:** October 13, 2026

## Intended testing environment

A two-core Ubuntu laptop with 16 GB RAM can run Expo Web and the Metro development server. An iPhone XS Max can open the web app through Safari on the same Wi-Fi. **This is a web preview, not a native iOS build.** Camera permission on plain HTTP LAN origins is not guaranteed because they are not secure contexts; test actual scanning under HTTPS or with an iOS development build.

## Option A — UI-only browser preview

```bash
cd ~/codespace/bdc/BDCHub---DutyLog/mobile
npm install
npx expo install react-dom react-native-web @expo/metro-runtime
npx tsc --noEmit
npx expo start --web --port 3000 --host lan
```

Ubuntu: `http://localhost:3000`. iPhone: `http://<UBUNTU-IP>:3000`; find the IP using `hostname -I`. Use dummy data only over unencrypted LAN development HTTP.

## Option B — same-origin staging proxy

The development proxy belongs to the v2 overlay, not necessarily the public repository. Run the proxy and Expo in separate terminals:

```bash
# Terminal A: from the extracted overlay
export DUTYLOG_UPSTREAM='https://<APPROVED-STAGING>/dutylogapiv1'
export DUTYLOG_AUTH_UPSTREAM='https://<APPROVED-STAGING>/apiv1'
export DUTYLOG_DEV_PORT=3000 DUTYLOG_DEV_BIND=127.0.0.1 EXPO_WEB_PORT=8081
node /path/to/dutylog-v2/scripts/dev-web-proxy.mjs
```

```bash
# Terminal B: inside the mobile directory
export EXPO_PUBLIC_API_URL='http://localhost:3000/dutylogapiv1'
export EXPO_PUBLIC_AUTH_URL='http://localhost:3000/apiv1'
npx expo start --web --port 8081 --host localhost --clear
```

**Open port 3000**, not Metro's port 8081. For iPhone access, configure a proxy that binds to the LAN address, use that address in frontend API configuration, and apply HTTPS before testing credentials/camera. `localhost` in Safari means the iPhone itself, not the Ubuntu laptop.

## Why Auth may work while DutyLog fails

An Auth Service CORS allowlist containing `http://localhost:3000` does not grant CORS access to the separate Go DutyLog service. In Firefox, `OPTIONS /dutylogapiv1/user/organizations → 404` without `Access-Control-Allow-Origin` means the browser blocked the cross-origin operation before JavaScript could read the response. Fix the API/gateway CORS policy or use an appropriate same-origin development proxy. Merely changing ports does not guarantee resolution.

## Diagnostic matrix

| Symptom | Investigation |
|---|---|
| `NetworkError` | Network panel: actual Request URL, `OPTIONS`, status, allow-origin headers. |
| GET 200, blank screen | JSON envelope, filters, client state, uncaught render errors. |
| iPhone cannot connect | Wi-Fi isolation, Ubuntu IP, listen address, firewall, port mapping. |
| Camera unavailable | Secure context, Safari permissions, Expo camera compatibility. |
| Fast Refresh broken | Metro logs and proxy handling of WebSocket upgrades. |
| Missing Lucide icon | Installed dependency version and actual named exports. |

## iPhone UI review checklist

Test around 390–430 CSS pixels wide; iPhone XS Max is approximately 414 CSS pixels wide in portrait. Validate safe areas, scroll position when keyboard is open, footer overlap, larger fonts, long lists, timezone display, throttled connections, and clear error states. Do not share real student identifiers in public screenshots.

## Source references

- [package.json](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/mobile/package.json)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
