# 19 · Performance Engineering and Load Testing

> **Status:** Benchmark methodology and proposed SLOs; no verified benchmark numbers · **Reviewed:** October 13, 2026

## Optimize the bottleneck, not the technology label

Adopting Kafka does not inherently make a camera scan fast. End-to-end latency includes camera decoding, network round-trip time, handler processing, database commit, and UI acknowledgment. Higher throughput accompanied by duplicate or missing scans is a correctness failure, not a successful optimization.

## Proposed load envelope (not achieved results)

| Stage | Target request rate | Duration | Purpose |
|---|---:|---:|---|
| Smoke | 10 RPS | 3 min | Check correctness and instrumentation. |
| Baseline | 50 RPS | 5 min | Obtain latency percentiles. |
| Medium | 200 RPS | 10 min | Reveal locks and pool contention. |
| High | 1,000 RPS | 10 min | Identify staging capacity limits, only with sufficient resources. |
| Burst | 2× sustainable RPS | 30–60 s | Exercise rate limiting and backpressure. |
| Recovery | 50 → 0 → 50 RPS | 5 min | Observe backlog drain and reconnect. |

A two-core Ubuntu laptop should not serve as both backend **and** 1,000-RPS load generator. Use an approved staging server, separate the load client where feasible, and measure generator CPU utilization.

## Essential measurements

- HTTP histogram p50/p95/p99 by normalized route and status; sustainable throughput and 4xx/5xx distribution.
- PostgreSQL pool utilization, wait count/duration, slow-query traces, row locks, and deadlocks.
- Redis command latency, cache misses, evictions, and reconnect behavior.
- Domain correctness: booking conflicts, idempotency replays, duplicate suppressions, and actual DB row counts.
- Outbox backlog age, consumer lag, retries, and DLQ count if asynchronous infrastructure is introduced.
- Device instrumentation for camera-decode-to-durable-ACK latency.

## Proposed SLO discussion points

| Indicator | Initial target | Test context |
|---|---|---|
| Scan API response p95 | <200 ms | Defined sustained staging load near service. |
| End-to-end scan p95 | <500 ms | Good campus Wi-Fi with camera decode measured. |
| Booking correctness | 0 overbookings, 0 duplicate active reservations | Concurrent race fixtures. |
| Acknowledgment correctness | 0 positive responses without commit | Fault injection. |
| Occupancy freshness p95 | <2 s | Only if a streaming implementation exists. |

**These figures are targets, not observed measurements.** Do not compare loopback latency to campus Wi-Fi latency as if the two environments were equivalent.

## Minimal read-only k6 smoke scenario

```javascript
import http from 'k6/http';
import { sleep, check } from 'k6';
export const options = { vus: 2, duration: '30s' };
const base = __ENV.STAGING_URL;
export default function () {
  if (!base) throw new Error('Set STAGING_URL');
  const r = http.get(`${base}/organizations`);
  check(r, { 'read responds': x => x.status === 200 || x.status === 401 });
  sleep(1);
}
```

This tests **read-only staging connectivity**. Write-load tests require signed test JWTs, isolated room fixtures, deterministic idempotency keys, explicit approval, and database reconciliation after the run.

## Evidence-driven tuning

- If row locks dominate: shorten transactions and review scoped locks and constraints.
- If the DB pool is saturated: budget `replica_count × max_open_connections`, not an unlimited connection pool.
- If Redis is slow: inspect network and command patterns, but never allow cache loss to erase durable attendance.
- Keep payloads small and use HTTP keep-alive; compression may not help tiny scan requests.
- Adopt Kafka only for a measured asynchronous fan-out requirement; do not insert it into the synchronous ACK path by default.

## Required benchmark report

Document commit and image digest, infrastructure topology, CPU/RAM, DB size, number of rooms/users, run ID, request mix, ramp profile, throughput, p50/p95/p99, status/error breakdown, duplicates/overbooks, metrics graphs, sanitized raw logs, and the next recommended action.

## Source references

- [performance-tests](https://github.com/Big-Data-Club/CoreApplication/tree/main/performance-tests)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
