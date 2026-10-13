# 27 · Documentation Governance and Review Cadence

> **Status:** Documentation governance recommendations · **Reviewed:** October 13, 2026

## Canonical sources and Wiki responsibilities

| Information type | Canonical location | Wiki responsibility |
|---|---|---|
| HTTP routes and JSON contract | Go handlers and approved OpenAPI spec, if available | Explain tested examples and compatibility. |
| Database schema | Versioned migrations | Explain domain relationships and retention. |
| Authorization policies | Middleware, handlers, and tests | Explain the reviewed permission matrix. |
| Production configuration | K3s manifests and secret management | Provide safe runbooks with no secrets. |
| Released revision | Image digest and Core submodule gitlink | Point to a traceable release record. |
| Product and architecture decisions | Issues, roadmap, accepted ADRs | Explain context, rationale, and open trade-offs. |

## Suggested review cadence

- **API, schema, and security:** review in the same PR that changes executable behavior.
- **Runbooks and on-call material:** review monthly and after incidents.
- **Product and UX:** review each research iteration or design milestone.
- **Architecture/ADR:** write a new decision or explicit supersession; never silently rewrite historical decisions.

## Required metadata on critical pages

Include document owner, last review date, source commit or PR, target environment, evidence classification (verified/candidate/proposed), links to test artifacts, and outstanding issues. A recent review timestamp **does not imply the page has been production-tested**.

## Preventing documentation drift

Use Markdown lint and link checking in documentation CI. When describing a released version, prefer source links containing an immutable commit SHA rather than a moving `main` reference. If documentation is eventually synchronized from `docs/wiki/` to `.wiki.git`, use narrowly scoped bot credentials, protected publish branches, and a policy preventing edit conflicts between automatic publication and direct Wiki editing.

Never commit credentials, raw QR values, personally identifying exports, or complete production logs to Wiki examples.

## Publishing models

**Model A — Direct Wiki Git repository:** clone `BDCHub---DutyLog.wiki.git`, review edits, push Markdown pages. Simple and sufficient while the contributor group is small.

**Model B — Reviewed docs in source:** maintain `docs/wiki/` in the main repository and publish to GitHub Wiki via GitHub Actions after approval. Prefer this model once the team needs full PR checks and source-linked reviews.

---
[Home](Home) · [API Contract](API-Contract) · [Roadmap & Backend Gaps](Roadmap-and-Backend-Gaps)
