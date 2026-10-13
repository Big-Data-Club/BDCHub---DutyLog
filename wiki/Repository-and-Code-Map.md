# 03 · Repository Layout and Ownership Boundaries

> **Status:** Public-source map verified; v2 additions are merge candidates · **Reviewed:** October 13, 2026

## Repository structure

```text
BDCHub---DutyLog/
├── .github/workflows/         # Review actual workflow files before relying on them
├── backend/
│   ├── cmd/server/main.go     # Gin router and application wiring
│   ├── internal/db/db.go      # SQL pool and V001–V003 migrations
│   ├── internal/middleware/   # Optional, required, and admin auth
│   ├── internal/handler/      # HTTP handlers
│   ├── internal/sync/         # Auth organization/member synchronization
│   └── internal/rds/          # Redis integration
├── mobile/
│   ├── App.tsx                # Root navigation and route state
│   ├── src/api/client.ts      # API, session, and legacy fallback behavior
│   ├── src/screens/           # UI screens
│   └── package.json          # Expo SDK 51 in public main
└── docs/
    ├── API_SPECIFICATION.md
    ├── ARCHITECTURE.md
    └── adr/
```

**v2 overlay only:** `backend/internal/registration`, `mobile/src/api/reservations.ts`, `mobile/src/screens/v2/`, and `scripts/dev-web-proxy.mjs`. These additions are not inherently present in the public default branch.

## Service and data ownership

| Domain | System of record | What to avoid |
|---|---|---|
| Identity and organization membership | Java Auth Service | Direct cross-service writes to Auth database. |
| Rooms, presence, and duty records | DutyLog PostgreSQL | Treating Redis as an immutable audit ledger. |
| Current occupancy | Rebuildable cache/projection | Treating cache-only state as durable truth. |
| Slot bookings | Proposed DutyLog booking tables | Enforcing capacity solely in frontend code. |
| Notifications and analytics | Asynchronous events or derived aggregates | Delaying user acknowledgment to wait for analytics processing. |

## Read the code in the right order

1. Start with `backend/cmd/server/main.go` to establish which routes **actually exist**. A documented but unregistered route is not an implemented API.
2. Inspect handler validation, authorization checks, SQL transactions, and response envelopes.
3. Inspect migrations and constraints to understand durable invariants.
4. Compare each TypeScript client type, request, and error branch with the Go handler contract.
5. Follow the CoreApplication gateway rewrite before constructing a browser-facing URL.

## Pull request boundaries

- Backend PR: schema change, handler, negative authorization tests, contract fixtures, and rollback notes.
- Frontend PR: typed client, loading/error/empty/success states, navigation tests, and mobile screenshots.
- Deployment PR: configuration diff, smoke-test evidence, rollout strategy, and rollback command.
- Without verified staging evidence, label a candidate **In Review**, not **Done**.

## Source references

- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)
- [db.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/internal/db/db.go)
- [client.ts](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/mobile/src/api/client.ts)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
