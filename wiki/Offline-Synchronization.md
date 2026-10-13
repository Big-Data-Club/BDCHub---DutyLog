# 12 · Offline Scanning and Reconciliation

> **Status:** API documented but not routed on public `main` · **Reviewed:** October 13, 2026

## Current implementation boundary

`docs/API_SPECIFICATION.md` describes `POST /rooms/:room_id/sync-batch`, but the referenced public router does **not** register that endpoint. Some mobile paths use in-memory fallbacks; volatile JavaScript state is **not** a durable offline queue. Offline support remains a feature requiring design, implementation, and acceptance evidence.

## Proposed device-side queue

```text
ScanEnvelope {
  client_scan_uuid: UUID,
  room_id, scanner_actor_id, payload_token_reference,
  action, observed_at_device, sequence_no,
  device_installation_id,
  state: PENDING | SENT | ACKED | REJECTED
}
```

Persist envelopes in an encrypted, durable local store—not a process-memory array. Minimize stored personal data and enforce a deletion policy. An expiring QR token scanned while offline creates a security decision that must be explicit; recording the timestamp on an untrusted device does not automatically make it valid.

## Server reconciliation algorithm

1. Authenticate the scanner, organization, room permissions, and enrolled device on replay.
2. Preserve the original `client_scan_uuid` across every retry.
3. Deduplicate at the database level; an already applied event may return `ACK_DUPLICATE` but must not be inserted again.
4. Validate device clock skew, sequence ordering, per-person/room state, and the maximum permitted offline duration.
5. Return a separate durable result for **each** scanned item; a generic `202 QUEUED` must not be interpreted as every scan being accepted.
6. Quarantine contradictory or out-of-order events for an authorized manager to resolve.

## Illustrative response (proposed; not current contract)

```json
{
  "batch_id": "b_...",
  "results": [
    {"client_scan_uuid":"u1","status":"APPLIED","presence_id":501},
    {"client_scan_uuid":"u2","status":"DUPLICATE","presence_id":502},
    {"client_scan_uuid":"u3","status":"REJECTED","code":"TOKEN_EXPIRED"}
  ]
}
```

Do not silently change a published payload. Version a new batch contract and record its authorization, ordering, and compatibility decisions in an ADR.

## Honest UI states

- **Offline immediately after scan:** `Saved on this device — not yet verified`.
- **Successful reconciliation:** `Confirmed by server` with server timestamp and reference.
- **Rejected:** `Action required` with a concise reason and an authorized recovery path.
- **Pending scans:** visible count, last synchronization attempt, retry controls, and privacy-safe details.

## Acceptance tests

Kill the app with ten pending scans, restart and recover all ten; replay a batch twice with no duplicate rows; skew device clock by thirty minutes; switch organization while scans remain pending; revoke a token; lose network after server commit but before ACK; return partial results; and stress queue chunking at 500 and 5,000 events. Verify data expiration and storage encryption.

## Source references

- [API_SPECIFICATION.md](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/docs/API_SPECIFICATION.md)
- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
