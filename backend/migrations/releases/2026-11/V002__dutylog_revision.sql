-- ============================================================
-- DutyLog Service - V002 Database Schema Revision
-- Implements Organization Membership, Duty Shift Records,
-- Scanner Identity Tracking, and Access Validation Alerts.
-- Author: BDC Dev Team
-- ============================================================

-- ── Organization Members (Synchronized from Auth Service) ────
CREATE TABLE IF NOT EXISTS organization_members (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL,
    student_code    VARCHAR(64),
    email           VARCHAR(255),
    full_name       VARCHAR(255),
    org_role        VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_member UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_code ON organization_members(organization_id, student_code);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON organization_members(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- ── Enhance Presence Logs with Scanner Identity & Validation ─
ALTER TABLE duty_presence_logs ADD COLUMN IF NOT EXISTS scanner_id VARCHAR(64);
ALTER TABLE duty_presence_logs ADD COLUMN IF NOT EXISTS scanner_name VARCHAR(255);
ALTER TABLE duty_presence_logs ADD COLUMN IF NOT EXISTS is_valid_member BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_presence_valid_member ON duty_presence_logs(room_id, is_valid_member);
CREATE INDEX IF NOT EXISTS idx_presence_scanner ON duty_presence_logs(scanner_id);

-- ── Duty Shift Records (Actual executed duty shifts) ──────────
CREATE TABLE IF NOT EXISTS duty_shift_records (
    id               BIGSERIAL PRIMARY KEY,
    organization_id  BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    room_id          VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    duty_staff_id    VARCHAR(64) NOT NULL,
    duty_staff_name  VARCHAR(255) NOT NULL,
    duty_staff_email VARCHAR(255),
    start_time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time         TIMESTAMPTZ,
    status           VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED'
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_records_room ON duty_shift_records(room_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_shift_records_org ON duty_shift_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_shift_records_staff ON duty_shift_records(duty_staff_id, status);
