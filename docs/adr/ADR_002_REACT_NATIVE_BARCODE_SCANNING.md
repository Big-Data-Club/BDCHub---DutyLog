# ADR 002: React Native with Hardware Camera Barcode Scanning

| Field    | Value            |
|----------|------------------|
| Status   | Accepted         |
| Date     | 2026-09-15       |
| Authors  | BDC Dev Team     |

---

## Context

Attendance verification requires reading one dimensional barcodes (Code 128, Code 39) or two dimensional codes printed on physical student identity cards.

Students and duty members move constantly between campus locations and through busy corridors. The scanning mechanism must be frictionless:
* Instant camera frame capture and recognition under low ambient lighting.
* Immediate physical confirmation via tactile haptic vibration and audio feedback so students do not need to look repeatedly at the screen.
* Reliable push notifications for upcoming duty shifts.
* Offline capability when traversing basements or areas with patchy wireless coverage.

We evaluated whether to build a Progressive Web Application (PWA) or a cross platform mobile application using React Native.

---

## Decision

The BDC Dev Team selects React Native with the Expo Camera ecosystem for client development.

Key components:
* React Native framework using TypeScript.
* Native camera integration configured for hardware accelerated barcode recognition (Code 128, Code 39, and QR code standards).
* Haptic feedback module emitting short vibration patterns on successful recognition.
* Audio playback module playing an instant confirmation chime.
* Push notification integration for scheduled duty warnings.

---

## Alternatives Considered

### Alternative 1: Progressive Web Application (PWA)
* Pros: Single codebase shared with web portals, no app store or package installation required.
* Cons: Web browser camera access suffers from variable initialization latency across mobile browsers; inconsistent barcode library performance on older Android devices; iOS Safari limits push notification background reliability; lack of consistent native haptic vibration.
* Rejection Rationale: The core value of DutyLog depends entirely on fast, effortless physical scanning at the room entrance. Browser friction would encourage students to revert to paper sign in sheets.

### Alternative 2: Native Kotlin (Android) and Swift (iOS)
* Pros: Maximum performance and smallest binary footprint.
* Cons: Doubles development and maintenance overhead for the team across two independent codebases.
* Rejection Rationale: Unnecessary engineering overhead; React Native camera modules achieve parity with native performance for barcode frame analysis.

---

## Consequences

* Positive: Delivers rapid, native camera scanning with immediate haptic and audio feedback.
* Positive: Single TypeScript codebase covering both Android and iOS devices.
* Positive: Native push notifications keep duty members accountable across shifts.
* Trade off: Requires an initial application distribution step to club members.
