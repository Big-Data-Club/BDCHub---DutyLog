# 30 · Architecture Decision Records and Design Trade-offs

> **Status:** Example ADRs; none of ADR-005 through ADR-008 is asserted as merged · **Reviewed:** October 13, 2026

## Why decisions deserve their own records

An Architecture Decision Record (ADR) documents **why** a solution was chosen under specific constraints, which alternatives were considered, its risks, and the evidence that would justify revisiting it. It is not merely an architecture diagram. The source repository includes ADRs covering synchronous/asynchronous presence, React Native scanning, multi-organization tenancy, and offline reconciliation. Read each source file's actual status before claiming that its design has been deployed.

## ADR-005 (proposed): Acknowledge scans only after durable commit

**Context:** Campus Wi-Fi is occasionally unreliable; a client fallback may display success even when no ledger entry exists.

**Options:** A. Fire-and-forget queue with immediate optimistic acknowledgment. B. PostgreSQL transaction, durable acknowledgment, and asynchronous event fan-out. C. Synchronously commit across DB, Redis, and Kafka.

**Proposed decision:** B. PostgreSQL remains authoritative; an outbox event is written in the same transaction when required; Redis is rebuildable. Without an acknowledgment, the UI displays a pending or uncertain state and retries using a stable idempotency key.

**Consequences:** Database latency remains on the critical path and requires connection-pool and lock tuning, but false-success risk is reduced. Option A is faster at the cost of misleading success. Option C couples availability to independent systems without shared ACID guarantees.

**Revisit when:** Measured p95 consistently violates the agreed SLO, retry correctness fails, or the product formally allows explicit eventual confirmation.

## ADR-006 (proposed): Kafka for asynchronous fan-out only

**Context:** CoreApplication already hosts Kafka, but high scan throughput does not automatically require a message broker on the HTTP path.

**Options:** Publish directly from the request handler, database polling with transactional outbox, managed queue, or no broker with SSE/polling.

**Proposed decision:** Benchmark PostgreSQL-only first. Introduce transactional outbox with idempotent Kafka consumers if replay, independent consumers, and fan-out justify the operational complexity.

**Risks:** Duplicate relay publication, DLQ privacy, hot partitions, schema drift, and ongoing broker maintenance.

**Verification:** Broker fault injection, no duplicated business effects, bounded scan p95, consumer lag and outbox alerts.

## ADR-007 (proposed): Strong consistency for the final bookable seat

**Context:** Two members simultaneously try to reserve the same last slot.

**Options:** Client-calculated `remaining`, optimistic versioning, or PostgreSQL row locks with unique constraints.

**Proposed decision:** Serialize allocation of one slot/date in a transaction, enforce DB uniqueness, and return idempotent replay results. Reconsider materialized occurrence rows if per-template contention grows.

**Verification:** Thirty concurrent requests for capacity one must yield one committed booking, no overbooking, and stable retry results.

## ADR-008 (proposed): Same-origin development proxy for Expo Web

**Context:** Auth may allow localhost:3000, while DutyLog's Go route fails browser `OPTIONS` preflight with 404.

**Proposed decision:** Route approved local/staging requests through a development-only same-origin proxy. Enforce production CORS policy consistently at the gateway/API boundary. A proxy does not substitute for JWT validation, resource authorization, or HTTPS.

**Security constraints:** Never expose a development proxy containing staging credentials to an untrusted Wi-Fi network; avoid logging raw bearer tokens.

## ADR template

```markdown
# ADR-NNN: <Short title>
Status: Proposed | Accepted | Superseded
Date: YYYY-MM-DD
Owners: ...
Related issues/PRs: ...
## Context and constraints
## Options considered
## Decision and rationale
## Positive and negative consequences
## Migration, rollback, and security implications
## Verification plan, SLI, and tests
## Review and supersession history
```

Mark an ADR **Accepted** only after approval. Mark an implementation **Delivered** only when the corresponding code, tests, and deployment evidence exist.

## Source references

- [adr](https://github.com/Big-Data-Club/BDCHub---DutyLog/tree/main/docs/adr)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
