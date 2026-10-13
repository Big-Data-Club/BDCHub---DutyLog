# 18 · Testing Strategy and Quality Gates

> **Status:** Test plan; individual checks still require execution evidence · **Reviewed:** October 13, 2026

## Test pyramid

| Layer | Primary concern | Suitable tools |
|---|---|---|
| Static checks | Format, lint, types, dependency and secret scanning | `gofmt`, `go vet`, TypeScript, dependency audit |
| Unit | Auth policy, booking rules, parsers, retry rules | `go test`, JavaScript test runner when configured |
| Contract | Status codes, JSON envelopes, auth boundaries | Go `httptest`, stored fixtures, OpenAPI checks |
| Integration | Real PostgreSQL, Redis, JWT fixtures, migrations | Ephemeral test database and controlled service containers |
| E2E | Booking wizard, scanner, error/empty states | Playwright for Expo Web, native iPhone smoke checks |
| Performance | Throughput, latency distribution, row contention | k6 and database metrics |
| Resilience | Redis/Kafka outages, retry correctness | Controlled staging fault injection |

## Resource-friendly commands

```bash
cd backend
GOMAXPROCS=2 go test -p 1 ./...
GOMAXPROCS=2 go vet -p 1 ./...
cd ../mobile
npx tsc --noEmit
```

Log the commit SHA, suite name, counts, runtime/OS, DB version, and environment. If a test requires PostgreSQL that is not available, report it as **Not Run** rather than passing it silently.

## Required booking v2 tests

- No JWT → 401; unauthorized organization → 403; inaccessible room → 403/404.
- One seat with at least twenty simultaneous contenders → exactly one committed reservation.
- Same idempotency key submitted concurrently → one business effect.
- Overlapping slots booked by the same member → at most one valid reservation.
- Cancellation at T−31 minutes versus T−29 minutes in `Asia/Ho_Chi_Minh`.
- Repeatable migrations; transaction timeout and exhausted DB pool behavior.

## Required scanner tests

- Duplicate static barcode; replayed rotating QR; tampered signed data; expired QR.
- Wrong organization, unassigned duty staff, missing credentials, expired admin token.
- DB unavailable after camera decode → visible error and **zero success acknowledgments**.
- Two independent devices scanning the same person in the same room concurrently.
- Redis-to-PostgreSQL projection mismatch and deterministic repair.
- Offline restart/retry/partial failure **only once a durable offline feature exists**.

## Contract fixtures and failure states

Store response fixtures beside contract tests and generate or verify them against real handler output. Test `GET /user/organizations` both with a legitimate `200` empty list and with network/CORS failure, proving that **Empty** and **Error** never collapse into the same UI state.

## Release approval gates

All P0 security and correctness cases must pass, with no regression of existing v1 consumers. Coverage percentages are secondary to transaction edge cases, negative authorization, deterministic E2E, staging smoke, a rehearsed rollback, and a benchmark report. Link each passing artifact to its pull request and release record.

## Source references

- [db.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/internal/db/db.go)
- [performance-tests](https://github.com/Big-Data-Club/CoreApplication/tree/main/performance-tests)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
