# 02 · Product Scope, Actors, and Responsibilities

> **Status:** Product requirements and proposed permission model · **Reviewed:** October 13, 2026

## The problem

BDC uses shared club rooms at different campuses. Paper sign-in makes it difficult to establish accurate arrival and departure times, identify current occupants, and aggregate meaningful duty hours. DutyLog provides login, organization/room selection, shift start/end, barcode/QR scans, and attendance history. Future features include reserving an available duty slot ahead of time.

## Personas and their responsibilities

| Actor | Primary tasks | Expected restrictions |
|---|---|---|
| Member | View own schedule, personal QR, and history | Cannot browse unauthorized room-level personal data. |
| Duty staff | Open a shift, scan visitors, observe occupancy | Must be assigned to an eligible room and shift. |
| Organization manager | Configure schedules, capacities, and attendance corrections | Limited to managed organizations. |
| Super administrator | Manage room inventory and inspect the system | Sensitive actions must be audited. |
| Guest / external visitor | May be admitted through controlled manual entry | Minimum data retention; never implicitly treated as a member. |

This is a **target access-control matrix**, not proof that handlers enforce it today. Current public source includes `RequireAdminJWT` and `OptionalAuth`; permissions must be reviewed per endpoint. Hiding a button is not access control.

## User stories and acceptance criteria

**US-01 — Room entry:** As assigned duty staff, I want to recognize and submit a student code with minimal interaction.

- Confirm success with sound or haptics only **after** durable server acknowledgment.
- Repeated scans must not create duplicate active presence sessions.
- When offline, show `Saved on device — awaiting sync`, not `Entered successfully`.
- Display a recoverable error if the code is invalid or belongs to another organization.

**US-02 — Slot registration (v2 merge candidate):** As a member, I want to reserve an available duty slot.

- Read slot availability and capacity from the server.
- When two people race for the last seat, only one succeeds.
- Reloading or retrying a request must not create additional reservations.

**US-03 — Audit and correction:** As a manager, I want to understand who checked in and why a scan failed.

- Return only records within authorized organizations/rooms.
- Include server timestamp, actor identifier, verification method, and decision outcome.
- If offline mode is supported, distinguish pending, rejected, and corrected records.

## Explicit exclusions

Payroll, precise GPS-based proof of presence, biometric authentication, and continuous video surveillance are not within the current scope. Automatic pre-shift reminders appear in architectural discussions but must not be treated as deployed until their producer and worker are verified.

## Product measurements

Track task completion rate, scan failure and duplicate rates, acknowledged attendance ratio, median task time, manual student-ID entry frequency, and accessibility success rate. Publish metrics only when they come from reproducible datasets or instrumentation, not from informal estimates.

## Source references

- [README.md](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/README.md)
- [WIKI.md](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/docs/WIKI.md)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
