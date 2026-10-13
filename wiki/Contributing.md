# 26 · Contributing to DutyLog: Workflow and Review Checklist

> **Status:** Proposed team process · **Reviewed:** October 13, 2026

## Branch and review conventions

Use focused names such as `feat/*`, `fix/*`, `docs/*`, `refactor/*`, or `perf/*`. Prefer small, independently reviewable PRs. Follow branch protection rules where enabled; do not bypass review by pushing directly to `main`. API additions and migrations should include contract and negative-path tests in the same PR.

## Commit examples

```text
feat(registration): add capacity-safe shift booking
fix(mobile): separate network error from empty organization list
test(api): cover cross-org access and QR replay
docs(wiki): document outbox failure recovery
```

## Suggested pull-request template

```markdown
### What changed
### Why / linked issue
### Compatibility / API contract / database migration
### Risks and security impact
### Evidence
- `go test -p 1 ./...`: PASS/FAIL and artifact
- `npx tsc --noEmit`: PASS/FAIL and artifact
- Redacted staging screenshots
- Load-test report if the scan or DB critical path changed
### Deployment and rollback
### Documentation and Wiki changes
```

## Reviewer rubric

Assess domain invariants and negative cases, cross-tenant boundaries, backwards compatibility, observability, deterministic testability, mobile usability, deployment safety, and documentation. Do not review only the successful UI path; explicitly exercise concurrency races, retries, expired sessions, stale state, and offline behavior.

When a PR changes a protocol or schema, update canonical source documents (`docs/API_SPECIFICATION.md`, migrations, and relevant ADRs). The Wiki is a living explanation and may be updated after merge using the team's documented publishing process.

## Definition of Done

A feature is complete only after a reviewed merge, passing relevant CI, staging smoke evidence, documentation, a release/rollback plan, and verified observability where required. **“Code has been written” means “In Review,” not “Done.”**

## Source references

- [CONTRIBUTING.md](https://github.com/Big-Data-Club/CoreApplication/blob/main/CONTRIBUTING.md)

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
