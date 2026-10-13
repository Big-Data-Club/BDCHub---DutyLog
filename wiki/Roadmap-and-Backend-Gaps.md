# 25 · Backend Gap Register, Priorities, and Evidence

> **Status:** Work tracking; never infer completion from code drafts alone · **Reviewed:** October 13, 2026

## Status vocabulary

- **VERIFIED:** Route or schema is demonstrably present in the inspected public source.
- **MERGE CANDIDATE:** Implementation exists in the v2 overlay but needs a PR, review, build, and integration tests.
- **PROPOSED:** Design or research item without verified implementation.
- **DONE:** Code merged **and** appropriate tests/staging acceptance passed; production-ready requires deployment and monitoring evidence.

## Prioritized engineering backlog

| Priority | Work item | Current evidence | Acceptance condition |
|---|---|---|---|
| P0 | Scan, shift, and history AuthN/AuthZ | Router uses OptionalAuth; handlers need audit | Anonymous and cross-organization operations denied. |
| P0 | Remove false-success fallback | Public mobile client contains mock paths; patch candidate | A network failure never produces a fake successful scan/login. |
| P0 | QR anti-replay | QR routes exist, protections need verification | Replay never adds another business record. |
| P0 | Presence idempotency | Scan UUID tracked but DB uniqueness unclear | One durable business effect per retry. |
| P0 | Migration readiness | Migration failure logged as a warning | App not ready for writes against incompatible schema. |
| P0 | Booking slots and reservations | Only in v2 overlay | Capacity-race and API contract tests pass. |
| P0 | CORS and organization list on Expo Web | Preflight 404 observed in local testing | API data loads and errors are distinct from empty. |
| P1 | Offline `/sync-batch` | Documented but absent from router | Durable client queue and per-item replay outcome. |
| P1 | Transactional outbox and Kafka publisher | Kafka configured; app code unproven | Outage recovery with no missing business events. |
| P1 | Realtime room board | Streaming implementation unverified | Freshness SLI and reconnect behavior validated. |
| P1 | Booking-to-attendance reconciliation | End-to-end linkage unverified | No-show, late arrivals, and duration policies tested. |
| P1 | Contract CI and staging release gates | Active workflows require inspection | Immutable release and rollback proof. |
| P2 | UX research and accessibility | Prototype exists | Measured usability task outcomes. |
| P2 | Analytics and reporting | Design stage | Reviewed data model and privacy policy. |

## Updating the task workbook

The Excel/Google Sheets tracker is the work management system; this Wiki does **not** synchronize task statuses automatically. Each item should include an owner, PR/commit URL, test run artifact, feature flag, migration, verification date, and reviewer sign-off. A successful compile is not sufficient to mark a feature complete.

## Recommended critical path

1. Audit route-level and resource-level authorization; remove fabricated acknowledgments.
2. Add contract tests and resolve Expo Web organization/CORS errors.
3. Verify booking migrations, database transactions, and simultaneous-seat races.
4. Perform staging E2E for reservation and cancellation.
5. Harden QR replay/idempotency and establish a PostgreSQL-only performance baseline.
6. Decide whether outbox/Kafka and SSE scale-out are justified **after** measurement.
7. Add digest-pinned CI/CD, CoreApplication submodule promotion, rollback, and monitoring evidence.

**Important:** The deployed DutyLog commit may differ from `main` because CoreApplication pins a submodule SHA. Use the deployed revision, not merely the newest public repository files, when documenting production behavior.

## Source references

- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)
- [dutylog](https://github.com/Big-Data-Club/CoreApplication/tree/main/dutylog)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
