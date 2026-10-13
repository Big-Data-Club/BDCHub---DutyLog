# 05 · REST API Contract and Backward Compatibility

> **Status:** Routes verified against public router; additional APIs are v2 merge candidates · **Reviewed:** October 13, 2026

## Public URLs versus internal routes

| Caller | Base path | Interpretation |
|---|---|---|
| Direct Go service | `/api/v1` | Routes mounted in `main.go`. |
| CoreApplication Compose Traefik | `/dutylogapiv1` | Gateway rewrites prefix to `/api/v1`. |
| Auth via Traefik | `/apiv1` | Independent Java Auth Service routes. |
| Expo Web development proxy | `/dutylogapiv1`, `/apiv1` | Same-origin browser calls forwarded to approved upstream. |

## Route inventory (observed in public `main.go`)

| Method | Service path | Router middleware | Purpose |
|---|---|---|---|
| GET | `/healthz` | None | Liveness; does not prove DB readiness. |
| GET | `/api/v1/user/organizations` | OptionalAuth | Organization discovery. |
| GET | `/api/v1/organizations` | OptionalAuth | Organization list. |
| GET | `/api/v1/orgs/:org_id/rooms` | OptionalAuth | Rooms in an organization. |
| POST | `/api/v1/rooms/:room_id/checkin` | OptionalAuth | Check in. |
| POST | `/api/v1/rooms/:room_id/checkout` | OptionalAuth | Check out. |
| GET | `/api/v1/rooms/:room_id/occupancy` | OptionalAuth | Current occupancy. |
| POST | `/api/v1/rooms/:room_id/shift/start` | OptionalAuth | Start duty shift. |
| POST | `/api/v1/rooms/:room_id/shift/end` | OptionalAuth | End duty shift. |
| GET | `/api/v1/rooms/:room_id/shift/current` | OptionalAuth | Active shift. |
| GET | `/api/v1/rooms/:room_id/presence-history` | OptionalAuth | Room presence history. |
| GET | `/api/v1/rooms/:room_id/duty-history` | OptionalAuth | Duty history. |
| GET | `/api/v1/students/:student_id/profile` | OptionalAuth | Student profile. |
| POST | `/api/v1/qr/generate` | OptionalAuth | Generate/rotate QR code. |
| POST | `/api/v1/rooms/:room_id/checkin-qr` | OptionalAuth | QR-based check-in. |
| POST | `/api/v1/sync/organizations` | OptionalAuth | Trigger organization synchronization. |
| GET | `/api/v1/admin/inspection/hierarchy` | RequireAdminJWT | Inspect hierarchy. |
| GET | `/api/v1/admin/rooms/:room_id/presence-history` | RequireAdminJWT | Admin presence history. |
| GET | `/api/v1/admin/rooms/:room_id/duty-history` | RequireAdminJWT | Admin shift history. |
| GET/POST | `/api/v1/admin/organizations`, `/api/v1/admin/orgs/:org_id/rooms` | RequireAdminJWT | List/create entities. |
| PUT/DELETE | `/api/v1/admin/rooms/:room_id` | RequireAdminJWT | Update/delete a room. |

**Security caveat:** `OptionalAuth` parses a token when present. It does **not** require authentication or demonstrate resource-scoped authorization. Inspect each handler before claiming the route is protected.

## Additive routes in the v2 overlay only

| Method | Service path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/orgs/:org_id/rooms/:room_id/availability?date=YYYY-MM-DD` | Date-scoped slot availability. | Merge candidate |
| POST | `/api/v1/duty-registrations` | Idempotent booking. | Merge candidate |
| GET | `/api/v1/me/duty-registrations` | My registrations. | Merge candidate |
| DELETE | `/api/v1/duty-registrations/:id` | Cancel registration. | Merge candidate |
| POST | `/api/v1/admin/shift-slots` | Admin slot definition. | Merge candidate |
| POST | `/api/v1/rooms/:room_id/sync-batch` | Offline synchronization. | Documented, not routed on public main |

## Backward compatibility rules

- Never change an existing v1 field's type, envelope, enum value, or status semantics without a documented migration and consumer plan.
- Adding fields is usually less disruptive than removing fields, but strict clients still require validation.
- Prefer real HTTP error statuses, stable machine-readable error codes, safe messages, and a request/correlation ID.
- Never return HTTP 200 with `success: true` if the intended DB write did not commit.
- Require a stable `Idempotency-Key` for retryable mutations; scope it to actor and operation.
- Page histories by a cursor where possible; avoid unbounded PII exports and deep offsets.

## Safe staging example

```bash
BASE_URL='https://<approved-staging>/dutylogapiv1'
curl -si "$BASE_URL/user/organizations" -H 'Authorization: Bearer <TEST_JWT>'
```

The Go `/healthz` route is outside `/api/v1`; do not assume the gateway exposes it under `/dutylogapiv1/healthz`. Inside a trusted cluster network, test `http://dutylog-service:8086/healthz` directly if authorized.

## Contract review checklist

- [ ] Gateway, internal, and staging URL mappings are verified.
- [ ] Negative tests cover `401`, `403`, `404`, `409`, `429`, and `503` where applicable.
- [ ] JSON examples come from handler behavior or contract tests, not assumptions.
- [ ] JWT signature, algorithm, issuer, audience, and expiry are validated.
- [ ] Old clients still work with the new backend revision.

## Source references

- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)
- [API_SPECIFICATION.md](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/docs/API_SPECIFICATION.md)
- [docker-compose.yml](https://github.com/Big-Data-Club/CoreApplication/blob/main/docker-compose.yml)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
