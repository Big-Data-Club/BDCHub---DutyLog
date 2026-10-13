# 01 · Getting Started with DutyLog

> **Status:** Developer onboarding guide · **Reviewed:** October 13, 2026  
> Validate all commands against the checked-out commit and your approved test environment.

## What success looks like

A new engineer should be able to inspect the repository, run TypeScript validation, start Expo Web, open it from an iPhone on the same Wi-Fi, perform a safe staging health check, and explain how the Auth Service, DutyLog API, PostgreSQL, and Redis interact. Budget roughly 45–90 minutes for an initial walkthrough.

## Development prerequisites

| Tool | Recommended baseline | Notes |
|---|---|---|
| Ubuntu | 22.04 or 24.04 | A two-core, 16 GB laptop can run Expo Web and sequential Go tests. |
| Git | Maintained release | Configure SSH or an approved HTTPS credential helper. |
| Node.js | 20 LTS for SDK 51 baseline | Follow the lockfile and confirm Expo compatibility. |
| Go | 1.22+ | Match the version declared by `go.mod`. |
| Browser | Firefox or Chromium | Network and Console panels are essential. |
| PostgreSQL / Redis | Staging or local | Kafka is unnecessary for UI-only smoke testing. |

## Clone and isolate your changes

```bash
mkdir -p ~/codespace/bdc && cd ~/codespace/bdc
git clone https://github.com/Big-Data-Club/BDCHub---DutyLog.git
cd BDCHub---DutyLog
git switch -c docs/test-setup
git status --short
```

If an earlier v2 overlay is already applied, inspect `git diff` first. Do not reapply an overlay blindly and overwrite unfinished work.

## Frontend smoke test

```bash
cd mobile
npm install --no-audit --no-fund
npx expo install react-dom react-native-web @expo/metro-runtime
npx tsc --noEmit
npx expo start --web --port 3000 --host lan
```

Open `http://localhost:3000` on Ubuntu or `http://<UBUNTU-LAN-IP>:3000` in iPhone Safari on the same trusted Wi-Fi. Plain HTTP over the LAN is only appropriate for visual review with non-sensitive test data. Camera access generally requires HTTPS, and real credentials must not traverse untrusted or unencrypted networks.

## Lightweight Go checks

```bash
cd ../backend
GOMAXPROCS=2 go test -p 1 ./...
GOMAXPROCS=2 go vet -p 1 ./...
```

If a check fails, record the exact command, commit SHA, sanitized output, environment, and expected result in an issue. A command running on another developer's machine is not acceptance evidence for your checkout.

## Ready for your first pull request

- [ ] Read the [API Contract](API-Contract), including internal and gateway paths.
- [ ] Use approved staging fixtures and correctly scoped test identities.
- [ ] Never commit production URLs containing secrets or exported tokens.
- [ ] Record passing `tsc`, Go test, and vet runs against a specific revision.
- [ ] Attach redacted screenshots and network traces for frontend bugs.
- [ ] Identify the feature's status: public-source verified, merge candidate, or proposed.

## Source references

- [BDCHub---DutyLog.git](https://github.com/Big-Data-Club/BDCHub---DutyLog.git)
- [package.json](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/mobile/package.json)
- [go.mod](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/go.mod)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
