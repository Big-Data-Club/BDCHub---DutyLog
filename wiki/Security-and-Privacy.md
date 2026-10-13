# 23 · Security and Personal Data Protection

> **Status:** Security review findings and proposed controls · **Reviewed:** October 13, 2026

## Threat model

Relevant threats include forged or replayed QR codes, leaked session tokens, broken object-level authorization (BOLA), lateral access across organizations, brute-force student-ID entry, CORS/CSRF confusion, log injection, QR enumeration, unrestricted personal-data exports, and denial of service during busy hours.

## Defense in depth

**Client:** Keep short-lived access tokens in memory where practical and sensitive native credentials in approved secure storage. Define a separate browser storage policy. Never embed `JWT_SECRET`, `QR_SECRET`, or service API secrets in `EXPO_PUBLIC_` variables or an application bundle. Fail closed on network errors and prevent synthetic session success.

**Gateway:** Enforce HTTPS, a precise origin/method/header CORS policy, request-body limits, rate limits, and appropriate security headers. Browser CORS rules do not replace AuthN or AuthZ.

**API:** Validate JWT claims, per-resource organization membership, schemas and sizes, server timestamps, idempotency keys, QR signatures, and rate limits. Audit decisions and privileged overrides using sanitized actor identifiers.

**Database and backups:** Apply data minimization, justified retention, encryption in transit and at rest, limited restore privileges, and audited data exports. Do not use real production student records for load tests. Avoid embedding full personal identifiers in cache keys.

**Events and analytics:** Limit event payloads to what consumers require, redact DLQ data, version schemas, and restrict broker topic permissions.

## Source-specific P0/P1 review items

1. `OptionalAuth()` protects neither presence mutations nor room histories by itself; inspect and test handler-level guards.
2. A development fallback value for `JWT_SECRET` must never be accepted in production.
3. Generic `MANAGER` role checks require organization-scoped verification.
4. `POST /sync/organizations` needs explicit service/admin authorization and rate limiting.
5. Legacy mobile `client.ts` contains demo/offline fallback paths; verify that hardening patches have been merged and tested.
6. Compose includes a `QR_SECRET` placeholder; production secrets need sufficient entropy, secure provisioning, and rotation procedures.

## Incident priority guidance

- **P0:** unauthorized presence writes, unauthorized PII access, leaked credentials, or false success that corrupts attendance audit.
- **P1:** significant availability loss, duplicate bookings, or failed slot allocation.
- **P2:** visual inconsistency or scanner warnings without data-integrity impact.

## Minimum security test suite

Cross-organization access matrix, replay and expiry validation, rate limiting, missing-secret startup, untrusted HTML in organization names, PII redaction, accidental `.env` commit checks, and safe recovery after JWT/QR signing-key rotation.

## Source references

- [auth.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/internal/middleware/auth.go)
- [client.ts](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/mobile/src/api/client.ts)
- [docker-compose.yml](https://github.com/Big-Data-Club/CoreApplication/blob/main/docker-compose.yml)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
