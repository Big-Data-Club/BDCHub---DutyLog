# API v2 additive contract — registrations (staging candidate)

All existing endpoints are untouched. New endpoints are mounted in `/api/v1` and use `middleware.RequireAuth()` or `RequireAdminJWT()`. `JWT_SECRET` must match Auth service. `user_id` claim identifies the owner, never accept a user ID in the POST body.

## GET availability
`/orgs/1/rooms/CS1-303-B9/availability?date=2026-10-19`

Response 200:
```json
{"organization_id":1,"room_id":"CS1-303-B9","date":"2026-10-19","timezone":"Asia/Ho_Chi_Minh","slots":[{"id":12,"label":"Chiều","starts_at":"13:00","ends_at":"17:00","capacity":3,"remaining":2,"status":"OPEN"}]}
```
Possible errors: 400 wrong date, 401 invalid auth, 403 unauthorized member, 500 DB unavailable.

## POST booking
`/duty-registrations` body:
```json
{"organization_id":1,"room_id":"CS1-303-B9","slot_id":12,"date":"2026-10-19"}
```
Header: `Idempotency-Key: <uuid>`.
201 on initial commit; 200 same-key replay; 400 validation; 403 cross-org; 404 slot missing; 409 full/overlap/started/idempotency mismatch; 500 backend/storage fault.

## GET /me/duty-registrations
Returns last 100 rows `{registrations:[{id,user_id,organization_id,room_id,room_name,slot_id,label,duty_date,starts_at,ends_at,status,created_at}]}`. Pagination and filters still pending.

## DELETE /duty-registrations/{id}
200 idempotent owner cancel; 404 not owned/not found; 409 cancellation too late.

## POST /admin/shift-slots
Body `{organization_id,room_id,weekday,label,starts_at,ends_at,capacity}`. `weekday` ISO Mon=1 to Sun=7. Response 201 `{id,status:"ACTIVE"}`. Duplicate template returns 409. Editing/deactivating slots still pending.

## Caveats
Availability snapshot is advisory; POST does fresh atomic capacity validation. Status codes are *new* contract; do not change old response types. Downstream integration is not production-certified until contract tests pass against Auth+Postgres+actual reverse proxy.
