# 29 · Glossary of DutyLog Engineering Terms

> **Status:** Terminology guide · **Reviewed:** October 13, 2026

| Term | Meaning in DutyLog |
|---|---|
| Presence | Whether a person is inside or outside a room; separate from duty-shift hours. |
| Duty shift | A time period during which a member is assigned to cover a room. |
| Shift record | Evidence of an actual started/ended shift. |
| Shift template | A recurring weekly time window used to offer slots (v2 candidate). |
| Slot occurrence | One instance of a template on a specific calendar date. |
| Booking/registration | Claiming one available seat in a slot occurrence. |
| Tenant/organization | Data and permission boundary for a club or organizational unit. |
| AuthN | Verifying the identity and credential of the caller. |
| AuthZ/RBAC | Determining whether a verified identity can perform an action on a resource. |
| BOLA | Broken Object-Level Authorization: accessing another entity's data through object IDs. |
| Idempotency | Repeating the same business operation has no additional business effect. |
| Critical path | Operations that must complete before durable success acknowledgment. |
| Transactional outbox | Recording business data and its outgoing event atomically in the same database transaction. |
| At-least-once | Transport can redeliver; consumers must handle duplicates. |
| Eventual consistency | A derived view can temporarily lag the authoritative database. |
| p95 latency | The value at or below which 95% of measured requests complete. |
| SLI/SLO | Service-Level Indicator / Service-Level Objective. |
| DLQ | Dead-Letter Queue for messages that cannot be processed after approved retries. |
| CORS preflight | Browser OPTIONS request checking cross-origin request permissions. |
| Staging | Controlled production-like test environment using synthetic fixtures. |
| Commit SHA | Identifier of Git source revision; not the same as a container digest. |
| Container image digest | Immutable hash identifying container image content. |
| Git submodule | Gitlink pointing from CoreApplication to a specific DutyLog commit. |
| MSSV | Vietnamese student identifier / student number; distinguish from Auth user ID. |

## Identifier and timestamp conventions

The presence API's `student_id` may be an alphanumeric student-number string, while `user_id` from Auth may be numeric: **do not join or substitute them without an explicit mapping**. Existing room IDs are strings such as `CS1-303-B9`; organization IDs are numeric in the referenced schema. Prefer RFC 3339 UTC timestamps on the wire, while interpreting duty occurrence dates in `Asia/Ho_Chi_Minh` according to the v2 booking proposal.

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
