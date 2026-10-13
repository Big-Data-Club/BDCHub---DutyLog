# 06 · Authentication, Authorization, and Tenant Isolation

> **Status:** Security assessment; router-level middleware verified · **Reviewed:** October 13, 2026

## Authentication is not authorization

**Authentication (AuthN)** verifies the identity and validity of the caller's JWT. **Authorization (AuthZ)** determines whether that identity is permitted to act on a particular organization, room, duty shift, or record. The frontend's logged-in state must never substitute for a server authorization decision.

## Observations from public source

- `middleware.OptionalAuth()` extracts a Bearer token if available; absent/invalid credentials do not automatically abort every request.
- `RequireAuth()` requires a valid token and exposes claims such as `user_id`, `email`, and `is_admin` in request context.
- `RequireAdminJWT()` checks a set of roles including `ADMIN`, `SUPER_ADMIN`, and `MANAGER`; a role name alone does not prove authority over a *specific organization*.
- The referenced authentication middleware includes a fallback `JWT_SECRET` when the environment is empty. Production must reject startup without a valid configured secret and enforce an explicit signing algorithm, issuer, audience, and expiration policy.
- User identifier claims must be contract-tested against the Java Auth Service.

## Proposed authorization matrix

| Operation | Member | Duty staff | Organization manager | Super administrator |
|---|---|---|---|---|
| List organizations | Own memberships | Own memberships | Own memberships | Explicit global access |
| Read room metadata | Authorized organization | Assigned organization | Managed organization | Allowed |
| Book/cancel a duty slot | Own bookings | Own bookings | Own bookings | Explicit policy |
| Start/end a shift | Restricted | Assigned room/time | Managed room | Audited override |
| Scan or mutate presence | No general scan right | Authorized active shift | Organization scoped | Audited emergency access |
| Read identifiable history | Own limited data | Assigned room scope | Managed organization | Audited |
| Manage slots | No | No | Own organization | All |
| Trigger organization sync | No | No | Dedicated service/admin policy | Explicit access |

This is a **proposed product/security contract**. Before adoption, verify each endpoint's handler-level protections and have the product owner approve exceptions.

## Recommended middleware pipeline

```text
HTTP request
  -> Parse Bearer JWT
  -> Verify algorithm, signature, exp, iss, aud
  -> Resolve actor from verified subject
  -> Resolve current organization membership
  -> Load room and compare its organization_id
  -> Authorize role, assigned shift, and permitted time window
  -> Log authorization decision without secrets
  -> Execute handler
```

Never trust `user_id`, `organization_id`, or `role` in a request body as evidence of caller identity. Load the target resource and check it against verified memberships. For managers, do not equate a generic `MANAGER` claim with unrestricted cross-tenant access.

## Threat scenarios and negative tests

1. A member of organization A requests room B's history: return `403` or a privacy-preserving `404`.
2. A valid JWT with an unsupported role or missing subject claim cannot access protected mutations.
3. Expired tokens, incorrect issuer/audience, and unexpected signature algorithms fail authentication.
4. Anonymous requests to presence mutations and organization-sync triggers are rejected.
5. An admin changes `room_id` in the URL to act on another organization: deny the operation.
6. Revoked or expired credentials cannot be overridden by cached frontend profile data.
7. Logs must not expose raw Authorization headers, QR tokens, passwords, or complete student IDs.

## CORS is a browser control, not an authorization layer

Expo Web can fail with `OPTIONS 404` and report `NetworkError` even when Java Auth login succeeds: Auth and DutyLog may have different CORS policies. Use the same-origin development proxy for local testing, and configure a strict origin/method/header allowlist at the production boundary. Never combine wildcard origins with credentialed access.

**Definition of done:** route-by-route role/tenant contract tests, audited denials, staging cross-organization fixtures, a secret-rotation procedure, and removal of all false-success authentication fallbacks.

## Source references

- [auth.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/internal/middleware/auth.go)
- [client.ts](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/mobile/src/api/client.ts)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
