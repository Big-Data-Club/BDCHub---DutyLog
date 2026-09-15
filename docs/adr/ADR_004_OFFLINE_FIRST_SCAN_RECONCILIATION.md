# ADR 004: Offline First Scan Queue and Conflict Reconciliation

| Field    | Value            |
|----------|------------------|
| Status   | Accepted         |
| Date     | 2026-09-15       |
| Authors  | BDC Dev Team     |

---

## Context

Several campus locations, particularly concrete reinforced buildings and basement study areas, suffer from intermittent cellular data and university wireless connectivity drops.

If the mobile barcode scanner blocked or crashed whenever internet connectivity was lost, students would immediately abandon the application and return to handwritten logbooks. The mobile client must allow students to scan their student identity cards without interruption regardless of current network state.

---

## Decision

The BDC Dev Team implements an offline first queue architecture with idempotent reconciliation:

1. Local Device Queue:
   * When an entry or exit scan occurs while the device is disconnected, the scan record is appended to a durable local storage queue on the mobile device (using MMKV or SQLite).
   * The application immediately plays the confirmation chime and vibrates, displaying an offline indicator to the member.
2. Background Synchronization:
   * The mobile client monitors network reachability state.
   * As soon as network connectivity is restored, the queue worker flushes pending scans to the backend service via endpoint `POST /api/v1/rooms/{room_id}/sync-batch`.
3. Backend Idempotency and Order Resolution:
   * Each queued item contains a unique client generated UUID and an ISO timestamp representing the exact moment of physical barcode capture.
   * The backend database applies unique constraints across `(room_id, student_id, client_scan_uuid)` to guarantee deduplication if a sync request is retried.
   * Historical presence durations are calculated using the original client scan timestamp rather than the network ingestion timestamp.

---

## Alternatives Considered

### Alternative 1: Fail Fast Online Only Mode
* Approach: Reject scan attempts when no internet connection is detected.
* Rejection Rationale: Unacceptable user experience that directly undermines physical adoption in signal dead zones.

### Alternative 2: Synchronous Blocking Retries
* Approach: Freeze the mobile user interface until the current scan successfully uploads to the server.
* Rejection Rationale: Creates queues of students waiting to enter the room while a single phone attempts network retries.

---

## Consequences

* Positive: Seamless student scanning experience unaffected by campus network disruptions.
* Positive: Complete audit trail with accurate physical timestamps.
* Trade off: Temporary delay in real time occupancy updates on administrative web dashboards while devices operate offline.
