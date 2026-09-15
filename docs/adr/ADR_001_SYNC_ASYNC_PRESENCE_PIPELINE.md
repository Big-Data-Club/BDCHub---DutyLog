# ADR 001: Synchronous Verification and Asynchronous Presence Pipeline

| Field    | Value            |
|----------|------------------|
| Status   | Accepted         |
| Date     | 2026-09-15       |
| Authors  | BDC Dev Team     |

---

## Context

The Big Data Club operates three physical rooms located on two separate campuses: Room 605 C6 and Room 303 B9 at Campus 1, and Room 710 H6 at Campus 2. Students enter and depart these rooms during multiple duty shifts throughout the day.

When a student scans their student identity card at the entrance, the system must confirm attendance immediately. Any delay greater than 250 milliseconds creates queuing at the door, degrades user confidence, and tempts students to abandon the mobile application in favor of paper logs.

Simultaneously, the platform must support auxiliary operations:
* Validating attendance against scheduled duty rosters.
* Alerting leadership when a scheduled shift is unattended.
* Ingesting presence events into the BDC Data Lakehouse for semester analytics.
* Updating real time web monitoring dashboards for club administrators.

Executing all these secondary tasks within the HTTP request cycle would dramatically increase latency, introduce external failure points, and violate the target response time.

---

## Decision

The BDC Dev Team adopts a dual pipeline architecture:

1. Synchronous Path:
   * The mobile client submits a check in or check out request via HTTP POST.
   * The service validates identity, appends an audit row to PostgreSQL, updates an in memory active occupants set in Redis, and immediately returns HTTP 200 with an acknowledgement payload in under 150 milliseconds.
2. Asynchronous Path:
   * Upon successful database commit, the service publishes a presence event to Apache Kafka topic `dutylog.presence.v1`.
   * Background consumer workers asynchronously process duty shift comparisons, push notification alerts, Lakehouse analytical ingestion, and web dashboard broadcasts.

---

## Alternatives Considered

### Alternative 1: Purely Synchronous Execution
* Approach: The HTTP handler verifies attendance, compares duty schedules, triggers push notifications, and records metrics within a single transaction.
* Rejection Rationale: External services such as push notification gateways (Firebase Cloud Messaging) and Lakehouse writes introduce variable network delays (500 milliseconds to 3 seconds), causing request timeouts and blocking door entry.

### Alternative 2: Purely Asynchronous Queuing
* Approach: Mobile clients drop scan events into an ingestion queue and immediately receive HTTP 202 Accepted without database confirmation.
* Rejection Rationale: The client cannot confirm whether the card code was recognized or if the student was successfully added to the active room roster, eliminating instant feedback.

---

## Consequences

* Positive: Guarantees sub 150 millisecond response times for mobile card scanning.
* Positive: Downstream outages (such as notification service downtime or analytics lag) do not disrupt student entry at physical doors.
* Positive: Conforms directly with the repository wide BDC Hub event driven standard.
* Trade off: Requires running Redis and Apache Kafka broker infrastructure alongside the primary database.
