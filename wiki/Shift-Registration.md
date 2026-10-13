# 09 · Duty Shift Registration and Capacity Management

> **Status:** v2 booking module is a merge candidate, not a verified production feature · **Reviewed:** October 13, 2026

## Existing behavior versus the proposed extension

The public router supports starting/ending an active duty shift and reading shift records. It does **not** expose a date-specific advance booking API. The October 12 v2 overlay adds availability queries, reservation submission/cancellation, slot administration, and a four-step Expo booking wizard. Review the actual branch diff and prove database behavior before merging.

## Domain entities

- **Shift template:** weekly rule including room, weekday, local start/end time, and capacity.
- **Shift occurrence:** one template materialized for a local calendar date and timezone.
- **Registration:** a member's claim on one slot, with state `BOOKED` or `CANCELLED`.
- **Active shift record:** actual clock-in/clock-out data; it is **not** the same as a booking. Linking registration to realized duty records is an unresolved backend requirement.

## Expected booking sequence

```mermaid
sequenceDiagram
 actor Member
 participant Wizard as Expo Booking Wizard
 participant API as Booking API
 participant PG as PostgreSQL
 Member->>Wizard: Select organization, room/date, and slot
 Wizard->>API: GET date-scoped availability
 API-->>Wizard: Slots, remaining capacity, status
 Member->>Wizard: Confirm selection
 Wizard->>API: POST registration with Idempotency-Key
 API->>PG: BEGIN; lock slot; check membership, overlap, quota
 API->>PG: Insert registration; COMMIT
 API-->>Wizard: 201 BOOKED or 409 conflict
 Wizard-->>Member: Show success only for a committed booking
```

## Illustrative additive contract (not public `main`)

```http
GET /api/v1/orgs/1/rooms/CS1-303-B9/availability?date=2026-10-19
Authorization: Bearer <TEST_JWT>
```

```json
{"organization_id":1,"room_id":"CS1-303-B9","date":"2026-10-19","timezone":"Asia/Ho_Chi_Minh","slots":[{"id":12,"label":"Afternoon","starts_at":"13:00","ends_at":"17:00","capacity":3,"remaining":2,"status":"OPEN"}]}
```

```http
POST /api/v1/duty-registrations
Authorization: Bearer <TEST_JWT>
Idempotency-Key: <UUID>
Content-Type: application/json

{"organization_id":1,"room_id":"CS1-303-B9","slot_id":12,"date":"2026-10-19"}
```

Expected semantics in the overlay: first booking `201`, exact retry with identical key/payload `200`, exhausted/overlapping/conflicting request `409`, absent credential `401`, forbidden tenant `403`. Availability from GET is merely a **snapshot**; POST must recheck capacity inside the transaction. The draft cancellation policy closes thirty minutes before the slot; test timezone `Asia/Ho_Chi_Minh` and server clock skew.

## Concurrency acceptance matrix

| Scenario | Required result |
|---|---|
| Capacity 1, 30 concurrent users | One success, 29 conflicts, exactly one booking. |
| One user retries the same key | Same booking ID; no additional quota consumed. |
| Reused key with different payload | HTTP 409 conflict. |
| Room belongs to another organization | HTTP 403/404. |
| One member books overlapping occurrences | HTTP 409. |
| Date crosses UTC / Vietnam midnight boundary | Correct local-date occurrence. |
| Cancel before deadline | Registration becomes `CANCELLED`; seat released. |
| Cancel after deadline | HTTP 409. |
| Database fails before commit | No success state in UI. |

## Requirements still open

Complete manager CRUD, public holiday/timezone overrides, booked-versus-attended reconciliation, no-show handling, calendar export, notifications, paging, cancellation policy per organization, migration recovery, and a documented staging test report. Never roll out the overlay directly to production.

## Source references

- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)
- [API_SPECIFICATION.md](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/docs/API_SPECIFICATION.md)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
