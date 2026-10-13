# 10 · Transaction Correctness and Idempotency

> **Status:** Proposed reliability design; partial implementation in the v2 booking candidate · **Reviewed:** October 13, 2026

## Why idempotency matters

- An iPhone loses Wi-Fi immediately after POST; the client cannot tell whether the server committed.
- A camera reads the same student barcode twice in one second.
- A user double-taps, or a gateway retries after a timeout.
- A Kafka consumer is redelivered an event after restart.

Without stable idempotency, the system can create duplicate check-ins, reserve multiple seats for one intent, or calculate incorrect duty hours.

## Proposed mutation contract

An `Idempotency-Key` is a UUID generated **once for a business operation**, reused across retries of that operation. The server stores a unique `(actor_id, operation, key)` along with a canonical request hash and stored result reference. The same key/body returns the prior result; the same key with a different body returns `409`. Define retention based on both transaction lifecycle and privacy constraints.

```sql
-- Design example only; not part of the public database migrations.
CREATE TABLE idempotency_records (
 actor_id BIGINT NOT NULL,
 operation TEXT NOT NULL,
 key TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 result_ref TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY (actor_id, operation, key)
);
```

## Booking the last available seat

Inside one database transaction: lock the matching `duty_slots` row using `SELECT ... FOR UPDATE`, count active registrations for `(slot_id, duty_date)`, verify actor membership and overlaps, insert once, and commit. A partial unique index protects against repeat active bookings. The candidate implementation also uses a per-user advisory transaction lock to serialize overlapping reservations across rooms. Test isolation levels, lock timeouts, and deadlock behavior.

## Presence state is a different invariant

Define states such as `OUTSIDE`, `INSIDE(room)`, `PENDING_OFFLINE`, `UNKNOWN`, and `DISPUTED`. A repeated `CHECK_IN` while already inside should produce a documented idempotent acknowledgment or `409`—not a new active presence row. A client-only debounce timer is never sufficient for duplicate prevention.

## PostgreSQL, Redis, and Kafka are not one transaction

Do not claim atomic writes across these three systems. Make PostgreSQL the system of record. If an event must be delivered, persist an outbox row alongside the business row in **the same PostgreSQL transaction**; publish asynchronously after commit. Rebuild Redis occupancy projections if updates fail. Define which views require read-your-writes semantics.

## Verification plan

Inject faults before insert, after insert but before commit, after commit but before HTTP acknowledgment, and after Kafka publish but before marking the outbox item as sent. Trace by stable event IDs and compare database cardinality to downstream effects.

**Invariants:** never acknowledge an uncommitted operation, never double-apply one business intent, and eventually converge after retry.

## Source references

- [db.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/internal/db/db.go)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
