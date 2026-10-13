# 20 · Observability, Distributed Tracing, and Service-Level Objectives

> **Status:** Instrumentation design proposal · **Reviewed:** October 13, 2026

## Observability contract

Propagate a `request_id` or trace identifier from the edge gateway through the DutyLog API, PostgreSQL/Redis interactions, and any future outbox relay or consumer. Keep **application logs**, **security audit events**, and **metrics/traces** conceptually distinct. Emit structured JSON and avoid recording bearer tokens, QR payloads, passwords, or full student identifiers. Pseudonymize the actor ID where detailed attribution is unnecessary.

## Recommended metrics

```text
http_requests_total{route,status_class}
http_server_request_duration_seconds_bucket{route}
dutylog_scan_total{outcome,method}
dutylog_registration_total{outcome}
dutylog_idempotency_replay_total{operation}
dutylog_org_sync_age_seconds
dutylog_occupancy_reconciliation_diff
postgres_pool_wait_seconds_bucket
dutylog_outbox_pending_events
dutylog_outbox_oldest_age_seconds
kafka_consumer_lag{group,topic}  # only when a Kafka consumer exists
```

Use normalized route templates in labels. Avoid `student_id`, email, or uncontrolled per-room labels that can explode time-series cardinality and disclose personal information.

## Proposed alerts (tune from baseline)

| Alert | Example trigger | Operator action |
|---|---|---|
| Scan API failures | More than 2% 5xx over five minutes or p95 above SLO | Follow the [scan runbook](Incident-Runbooks). |
| DB pool saturation | Rising wait time and open connections near limit | Inspect queries, locks, pool budget. |
| Organization synchronization stale | No successful sync for >10 min | Check Auth connectivity and sync logs. |
| Missing domain events | Persistent ledger/outbox mismatch | Trace relay and consumer state. |
| Kafka consumer lag | Oldest unprocessed event >5 min | Review consumers, DLQ, broker health. |
| Browser preflight failures | Increase in OPTIONS 404 responses | Review edge routing and CORS middleware. |

These are starting hypotheses, not tuned alert thresholds. Review traffic volume, baseline error rate, false alerts, and business impact before enabling paging.

## Liveness is not readiness

The current `/healthz` route demonstrates process liveness but does not establish that PostgreSQL or Redis is healthy. Consider separate endpoints: `/livez` (process alive), `/readyz` (critical dependencies usable), and a protected `/metrics` route. Do not fail the scan path's liveness merely because a non-critical Kafka analytics consumer is lagging.

## SLO reporting

Document the reporting interval, covered routes, total request count, client/network environment, p50/p95/p99, and error definition. Maintain an error budget to inform whether to prioritize reliability work over feature rollout. A single successful `curl` is not evidence of near-perfect uptime.

## Source references

- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
