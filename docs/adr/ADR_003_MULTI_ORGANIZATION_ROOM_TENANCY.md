# ADR 003: Multi Organization Room Tenancy and Boundary Isolation

| Field    | Value            |
|----------|------------------|
| Status   | Accepted         |
| Date     | 2026-09-15       |
| Authors  | BDC Dev Team     |

---

## Context

While Big Data Club currently manages three physical rooms across two campuses, the university hosts multiple independent academic clubs, research laboratories, and student associations that also oversee designated study and hardware rooms.

The platform must support multi organization tenancy, enabling distinct organizations to:
* Register and configure their own physical rooms.
* Assign distinct duty rosters and schedule intervals for their own members.
* Maintain private attendance and presence logs without exposing member activity to other clubs.

At the same time, room management must integrate cleanly with the central BDC Hub Auth Service (`auth-and-management-service`) without violating database ownership rules.

---

## Decision

The BDC Dev Team adopts an organization scoped logical multi tenancy model:

1. Data Partitioning:
   * Every physical room entity contains a mandatory foreign key `organization_id`.
   * Duty schedules, attendance logs, and active Redis presence sets are partitioned by both `organization_id` and `room_id`.
2. Identity and Access Enforcement:
   * Requests include a signed JSON Web Token issued by BDC Hub Auth Service containing user identifiers and organization roles.
   * Service endpoints enforce that members can only view rooms and logs belonging to organizations where they hold active membership.
   * Administrative modifications (such as updating room capacity or configuring duty shifts) require administrative role verification within the target organization.
3. Decoupled Service Boundary:
   * In compliance with BDC Hub core architecture rules, DutyLog does not access the authentication database directly. User profile synchronization and organization validation occur through authenticated HTTP APIs or event payloads.

---

## Alternatives Considered

### Alternative 1: Single Tenant Hardcoding
* Approach: Hardcode rooms exclusively for Big Data Club (CS1 605 C6, CS1 303 B9, CS2 710 H6).
* Rejection Rationale: Fails the requirement to allow other university organizations to manage their own rooms and limits long term adoption across the campus.

### Alternative 2: Separate Database per Organization (Physical Isolation)
* Approach: Spin up isolated database schemas or individual PostgreSQL instances per club.
* Rejection Rationale: Excessive operational overhead and resource consumption for student club usage volumes. Logical row level partitioning provides complete security and isolation at fractional operational complexity.

---

## Consequences

* Positive: Enables university wide scalability across any number of clubs and departments.
* Positive: Protects member privacy across independent organizations.
* Positive: Reuses existing BDC Hub user identities and organization management workflows.
* Trade off: All database queries must include organization scoping filters to avoid cross organization data leakage.
