# 24 · Incident Response Runbooks

> **Status:** Operational guidance; execution depends on environment · **Reviewed:** October 13, 2026

## Response lifecycle

**Detect → Scope → Mitigate → Diagnose → Recover → Verify → Postmortem.** Record UTC detection time, affected environment, impacted organization/room (without exposing personal data), deployed SHA, representative request/trace IDs, and the decision to continue or roll back.

## Runbook A — Login works, but organizations disappear

1. Check the browser Network panel: did it call `/dutylogapiv1/user/organizations` through the intended proxy, or a direct cross-origin URL?
2. `OPTIONS 404` with missing `Access-Control-Allow-Origin` indicates CORS/preflight failure; do not change membership rows yet.
3. `GET 200` with nonempty data points to client parsing, selected filters, or stale UI cache.
4. `GET 200` with empty data points to Auth membership, claim mapping, and organization-sync freshness.
5. `GET 401/403` points to token expiry, issuer/audience mismatch, or tenant authorization.
6. Show a Retry error state on request failure instead of “No organizations found.”

## Runbook B — The UI said a scan succeeded, but the DB has no record

1. Collect request ID, `client_scan_uuid`, approximate time, room ID, and pseudonymous actor ID.
2. Check whether the HTTP response included a committed record identifier or the client generated a fake/offline success.
3. Use approved **read-only** access to inspect durable presence state and deduplication records.
4. Compare Redis projection with PostgreSQL and rebuild missing derived data.
5. If event processing exists, inspect outbox status, Kafka consumer lag, DLQ, and event IDs.
6. If the database transaction never committed, do not invent a matching audit row. Use an approved, auditable manual correction process.

## Runbook C — Peak-hour overload

Inspect p95/p99, 5xx/429, connection pool waits, row locks, CPU/RSS, Redis timeouts, and gateway latency. Temporarily reduce noncritical reads or increase polling backoff. Scale application replicas only if downstream database capacity exists. Ensure `replica_count × DB_MAX_OPEN_CONNS` remains within the PostgreSQL connection budget. Re-run a representative traffic test after mitigation.

## Runbook D — Failed schema migration

Compare the deployed image digest with the current schema. Pause rollout if the new app cannot safely read/write. Preserve backups and do not execute ad hoc destructive DDL during an incident. App rollback and schema rollback are different operations; propose a reviewed forward-fix when necessary.

## Runbook E — Safari cannot access the camera

Check HTTPS/secure-context status, browser permission, iOS version, and relevant Expo/Camera APIs. A URL such as `http://192.168.x.x` is generally not a secure context; it is not a valid basis for judging native scanner performance.

## Postmortem template

Summarize impact, detection, incident timeline, root and contributing causes, user-visible incorrect states, integrity verification, corrective/preventive actions, owners, deadlines, and links to permanent regression tests.

## Source references

- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
