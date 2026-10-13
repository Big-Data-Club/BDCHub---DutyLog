# 17 · UX Research and Interface Guidelines

> **Status:** Research plan guided by the v2 prototype · **Reviewed:** October 13, 2026

## Research questions

1. Can members complete a duty-slot reservation without a facilitator?
2. When scanning fails or Wi-Fi disconnects, do users understand that the scan **has not been confirmed**?
3. When an organization operates multiple rooms, can users reliably distinguish locations such as B9, C6, and H6?
4. Do managers need aggregate counts or identified attendance lists, and how should permissions differ?

## Practical study design

Recruit 5–8 participants per persona and iteration (member, duty staff, manager) for qualitative usability discovery. This sample size helps identify friction but must **not** be described as statistically representative of the full user population.

Use realistic workflows: sign in → select organization and room → reserve an available slot → scan a synthetic QR → inspect history → cancel a reservation. Include failure variants: unstable Wi-Fi, a fully booked slot, delayed server acknowledgment, and denied permissions.

Measure task completion, time-on-task, wrong taps, points of confusion, Single Ease Question (SEQ), and optionally the System Usability Scale (SUS) when administered consistently. Obtain consent before recording screens or collecting research notes. Link anonymized evidence to reproducible GitHub issues and prototype revisions.

## Required message design

| Situation | Recommended English UI copy |
|---|---|
| User truly has no memberships | “You are not a member of any organization yet.” + help/contact |
| Organizations API failed | “Unable to load organizations.” + Retry + request ID |
| Last slot just filled | “This shift is now full.” + Refresh |
| Reservation committed | Booking reference, room, date, time, and View My Shifts |
| Offline scan durably queued | “Saved on this device. Waiting for connection.” |
| Scan rejected | Explain why and provide a legitimate recovery action. |
| Authentication expired | “Your session has expired. Please sign in again.” |

Only display `Saved on this device` if a real **durable local queue** exists. Otherwise, show a failed request and do not imply data was preserved.

## Design system principles

Follow the prototype's electric blue accents, light neutral background, white cards, green success, amber caution, and red destructive actions. Color must not carry status meaning alone; pair it with labels and distinct icons. Centralize typography, spacing, radii, elevation, input states, and safe-area behavior in reusable design tokens.

For responsive web, constrain content width and prevent desktop-only patterns from changing the mobile information hierarchy. Account for mobile browser bars and software keyboards. Treat loading and empty states as first-class screens, not placeholders.

## Accessibility and privacy

Add screen-reader labels to icons, keyboard navigation and escape actions for overlays, visible focus outlines, sufficient contrast, dynamic text sizing, and reduced motion. Mask full student identifiers in histories unless the viewer has a documented reason to see them. Never record live bearer tokens, passwords, or student PII in research videos.

## Deliverables per research iteration

`Study plan → consent and anonymized notes → issue/insight board → severity and rationale → prototype changes → usability retest → acceptance decision.`

A screen looking “more polished” is not sufficient acceptance evidence. Describe the user's task outcome and the measurable problem resolved.

## Source references

- [mobile](https://github.com/Big-Data-Club/BDCHub---DutyLog/tree/main/mobile)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
