# 14 · Realtime Occupancy and Derived Projections

> **Status:** Occupancy GET endpoint verified; streaming architecture is a proposal · **Reviewed:** October 13, 2026

## Occupancy is a derived value

Current occupants are inferred from check-in and check-out events. When Redis is evicted or restarted, the active set must be rebuildable from PostgreSQL. The public router includes `GET /rooms/:room_id/occupancy`; the relevant code references Redis. Whether server-sent events or WebSockets are available must be verified independently.

## Source of truth by layer

| Layer | Responsibility | Recovery strategy |
|---|---|---|
| `duty_presence_logs` in PostgreSQL | Durable audit and attendance history | Reconcile or correct through approved audit procedure. |
| Redis active set | Fast occupancy projection | Rebuild from database or replay events. |
| Local UI state | Latest displayed snapshot | Refresh, compare version/watermark, show staleness. |
| Kafka, if introduced | Distribute change events | At-least-once delivery with consumer deduplication. |

## Polling versus SSE versus WebSockets

- **Polling every 3–10 seconds** is easy to deploy and may be sufficient for a limited number of rooms and viewers.
- **Server-Sent Events (SSE)** suit server-to-browser occupancy updates; the browser reconnects and can resume using `Last-Event-ID` if the service supports it.
- **WebSockets** are useful for genuine bidirectional coordination but add session, authentication, scaling, and recovery complexity.

Start with polling or SSE **after** verifying the occupancy snapshot contract. Realtime requirements should come from user needs and measured freshness, not the desire to adopt WebSocket technology.

## Reconnect and stale-data correctness

Display `last_updated_at` and an explicit `live/stale` indicator. Prefer monotonic per-room sequence numbers. Ignore events older than the currently displayed snapshot. On reconnect, fetch a fresh snapshot and resume streaming from a verified watermark so no interval is silently lost.

TTL alone cannot heal missed events. A Redis eviction should trigger a rebuild; it must not be misreported as an empty room unless confirmed. Members may see aggregate counts while identifiable occupant lists require additional authorization.

## Proposed freshness target

A possible occupancy freshness objective is p95 below two seconds with streaming, and recovery reconciliation within one minute after broker restoration. These are design targets, **not measured performance figures**.

## Source references

- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
