# DutyLog v2 — additive backend + Expo Web UI

## Scope and release truth

- This is a **merge overlay**, not an edited GitHub branch. The published repository was inspected through its accessible raw source (main.go, db.go, middleware/auth.go, mobile client.ts) as of 2026-10-12; remote checkout/install/database access was unavailable in the creation environment.
- Additive endpoints live in `backend/internal/registration`. Existing `/api/v1` handlers, payloads and response schemas are unchanged.
- New UI is based on the DutyLog UI v2 overlay and uses live server-side booking availability; NO mock slot capacity or success response.
- Replaces unsafe mobile API network fallbacks with real errors for login, shift, check-in/out, QR, occupancy and history. **Offline scan is intentionally NOT implemented here.** Disconnected scans must not be counted as successful until ACK.
- Builds, real JWT integration tests, schema migration in a staging PostgreSQL database, and scanner stress tests are still required. Do not merge/deploy to prod on syntax checks alone.

## Apply safely

```bash
cd /path/to/BDCHub---DutyLog
git status --porcelain             # save existing work first
git switch -c feat/dutylog-v2-bookings
unzip /path/to/DutyLog_Backend_Web_v2_Overlay.zip -d /tmp/dutylog-v2
/tmp/dutylog-v2/dutylog-v2/scripts/apply.sh "$PWD"
/tmp/dutylog-v2/dutylog-v2/scripts/check.sh "$PWD"
git diff --check
git status --short
```

Backups stored under `.git/dutylog-ui-v2-backups/<timestamp>` (or `.dutylog-ui-v2-backup-*` if no `.git` directory). The apply script **overwrites App.tsx, LoginScreen and several v2 screens** after backing them up. Review diffs if your team has also edited those screens. It preserves the existing backend API handlers.

## New API endpoints (additive)

All paths below assume base `/api/v1`; Traefik may expose it under `/dutylogapiv1`.

| Method | Path | Auth | Result |
|---|---|---|---|
| GET | `/orgs/:org_id/rooms/:room_id/availability?date=YYYY-MM-DD` | JWT + org membership | `{ room_id,date,timezone,slots:[{id,label,starts_at,ends_at,capacity,remaining,status}] }` |
| POST | `/duty-registrations` | JWT + org membership, `Idempotency-Key` | 201 `{id,status:"BOOKED",room_id,slot_id,duty_date,replayed:false}`; 200 on same key replay |
| GET | `/me/duty-registrations` | JWT | `{registrations:[...]}` (last 100) |
| DELETE | `/duty-registrations/:id` | JWT owner | `{id,status:"CANCELLED"}`; returns 409 inside 30 min before shift |
| POST | `/admin/shift-slots` | Admin JWT | 201 `{id,status:"ACTIVE"}` |

Example create admin shift template:

```bash
export BASE_URL='https://<approved-staging-host>/dutylogapiv1'
export ADMIN_TOKEN='...'
curl -i -X POST "$BASE_URL/admin/shift-slots" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"organization_id":1,"room_id":"CS1-303-B9","weekday":1,"label":"Chiều","starts_at":"13:00","ends_at":"17:00","capacity":3}'
```

Create booking (use actual returned `slot.id` and a fresh, stable UUID per intent):

```bash
export TOKEN='...'
export SLOT_ID='123'
export KEY="$(python3 -c 'import uuid;print(uuid.uuid4())')"
curl -i -X POST "$BASE_URL/duty-registrations" \
  -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $KEY" -H 'Content-Type: application/json' \
  -d "{\"organization_id\":1,\"room_id\":\"CS1-303-B9\",\"slot_id\":$SLOT_ID,\"date\":\"2026-10-19\"}"
```

The date above is illustrative; choose a future slot matching the configured ISO weekday. `day` semantics are Asia/Ho_Chi_Minh (+07:00). The schema is additive; `registration.Migrate()` runs after existing `db.RunMigrations()` and fails startup when migration cannot apply. **Back up the database and test rollback before deployment.**

## PostgreSQL semantics

- Slot row locked with `SELECT ... FOR UPDATE`, then count active registrations, insert, and commit. The lock serializes capacity checks across all requests for the same slot.
- `pg_advisory_xact_lock(user_id)` serializes concurrent bookings by one authenticated user across different slots, preventing overlapping bookings.
- Unique `(user_id, idempotency_key)` and active booking partial unique index provide replay safety. Idempotency keys are scoped to one user; reusing a key with another body is a 409.
- `organization_members` protects cross-tenant booking, `rooms.organization_id` guards room–org mismatches. Admin slot creation requires a valid admin/manager JWT AND a manager role in that organization; SUPER_ADMIN may manage any organization. Test this permission boundary against Auth claim conventions.
- No linkage to actual shift start/end, no attendance grading/no-show workflow, no transaction outbox, no consumer Kafka delivery, no offline sync. These remain open tasks.

## Expo Web (same-origin dev proxy)

**Direct cross-origin browser requests may fail CORS** even if native Expo calls work. The included development proxy keeps browser, Metro and remote staging APIs on one origin. It requires no new npm dependency.

```bash
cd /path/to/BDCHub---DutyLog/mobile
npm install
npx expo install react-dom react-native-web @expo/metro-runtime

# In a SEPARATE terminal, launch both Metro and the local proxy:
export DUTYLOG_UPSTREAM='https://<approved-staging-host>/dutylogapiv1'
export DUTYLOG_AUTH_UPSTREAM='https://<approved-staging-host>/apiv1'
/path/to/dutylog-v2/scripts/run-expo-web.sh "$PWD"
```

Open `http://localhost:8090` (not port 8081). The launcher sets `EXPO_PUBLIC_API_URL=http://localhost:8090/dutylogapiv1` and auth path automatically. The proxy is for **local development only**, defaults to binding to `127.0.0.1`, and is NOT a production proxy. For physical iPhone Safari use LAN binding only on a trusted network with additional access restrictions. Do not put refresh tokens in public env vars.

Expo Web browser session stores refresh token in **memory only** (reload logs out) rather than localStorage. Native builds continue to use expo-secure-store. OAuth remains unavailable until Auth Service contract is confirmed.

## Staging checks (must pass before claiming complete)

```bash
cd /path/to/BDCHub---DutyLog/backend
go test ./... && go vet ./...
cd ../mobile
npx tsc --noEmit
# then launch web as described above
```

Manual/automated integration scenarios:

1. Anonymous -> 401 for each new endpoint; member of other org -> 403; no JWT secret default in production.
2. Admin creates weekday template; GET slot status OPEN with correct local date.
3. Concurrent requests for capacity=1: exactly one 201 and others 409. Count never exceeds 1.
4. Retry with same `Idempotency-Key`: same registration ID, 200 replay, never duplicate.
5. Same key with changed payload: 409. Two overlapping slot times in different rooms: 409.
6. Cancellation by owner >30 min ahead -> 200; wrong owner -> 404; already started -> 409.
7. Backend network outage: login/QR/scan/shift/booking shows error, not success.
8. Verify UI on Expo Web at 375px, 390px, 430px, desktop; no horizontal overflow.
9. Database migration retry is idempotent; PostgreSQL backups and deploy rollback verified.
10. Run `k6` or equivalent load + fault tests before setting SLOs or choosing Kafka.

## Known open backend gaps

Existing `/checkin`, `/checkout`, `/shift/start`, `/shift/end`, `/sync/organizations` and some history endpoints are still under router-level `OptionalAuth()`; inspect handlers and enforce appropriate JWT, org/room RBAC and actor binding before production. `JWT_SECRET` fallback in middleware must be removed in production. The QR signer/replay, database/Redis consistency, transactional outbox/Kafka and offline sync all need separate security + load test work. DO NOT silently change the pre-existing API contract while upgrading these.
