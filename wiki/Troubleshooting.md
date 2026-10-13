# 28 · Troubleshooting Matrix

> **Status:** Operational troubleshooting reference · **Reviewed:** October 13, 2026

| Symptom | Potential cause | Evidence to collect | First corrective action |
|---|---|---|---|
| TypeScript `House` not exported | Installed Lucide version lacks the icon | Compiler TS2724 | Use an available named export and rerun `tsc`. |
| Expo Web shows a blank page | Metro/bundle/runtime failure | Terminal log and DevTools Console | Check dependencies, then clear cache only if needed. |
| Login works but no organizations appear | CORS, failed DutyLog GET, missing membership | OPTIONS/GET URL, status, response | Fix routing/CORS, distinguish error from empty. |
| `OPTIONS 404` | Gin/Traefik not handling preflight | Request origin and response headers | Same-origin dev proxy or validated allowlist middleware. |
| `404` for booking routes | v2 backend not deployed | Router source and image SHA | Disable booking UI or deploy to staging. |
| Check-in reports fake success | Client offline/mock fallback | Network trace and UI state | Fail closed and remove fabricated acknowledgment. |
| `401 Unauthorized` | Missing or expired JWT | HTTP status, sanitized claims | Refresh credentials or sign in again. |
| `403 Forbidden` | Missing organization/room permission | Role and membership fixtures | Audit resource-scoped authorization. |
| `502 Bad Gateway` | Service unavailable or wrong upstream | Gateway and service logs | Check DNS, port, ingress, readiness. |
| `500` during booking | Schema/migration mismatch | DB error trace and migration state | Repair staging migration and enforce readiness. |
| Redis occupancy disagrees with DB | Projection missed updates or was evicted | DB-versus-cache comparison | Reconcile and rebuild the projection. |
| Kafka lag increasing | Slow consumer or broker issue | Consumer lag, relay metrics, DLQ | Analyze consumer failures and bounded retries. |
| Safari denies camera | Insecure HTTP origin or permissions | Safari security console | Use HTTPS or a native development build. |

## Safe diagnostic commands

```bash
# Do not log or publish bearer tokens or personal data.
curl -si 'https://<APPROVED-STAGING>/dutylogapiv1/user/organizations'
cd mobile && npx tsc --noEmit
cd ../backend && GOMAXPROCS=2 go test -p 1 ./...
```

Unauthenticated responses may vary by deployment and access policy. Record the actual method, URL, response status, `request_id`, and environment. Sanitize headers, cookies, identity fields, and log excerpts before posting an issue.

## Source references

- [main.go](https://github.com/Big-Data-Club/BDCHub---DutyLog/blob/main/backend/cmd/server/main.go)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
