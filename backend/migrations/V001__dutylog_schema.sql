-- ============================================================
-- DutyLog Service - V001 Database Schema
-- Designed for PostgreSQL (compatible with Neon serverless)
-- Author: BDC Dev Team
-- ============================================================

-- ── Organizations (logical tenant mapping from auth service) ──
CREATE TABLE IF NOT EXISTS organizations (
    id          BIGINT PRIMARY KEY,
    slug        VARCHAR(64) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Physical Rooms ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
    id              VARCHAR(64) PRIMARY KEY, -- e.g. 'CS1-605-C6', 'CS1-303-B9', 'CS2-710-H6'
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campus          VARCHAR(64) NOT NULL,    -- 'Campus 1', 'Campus 2'
    building        VARCHAR(64) NOT NULL,    -- 'C6', 'B9', 'H6'
    room_number     VARCHAR(32) NOT NULL,    -- '605', '303', '710'
    name            VARCHAR(128) NOT NULL,
    capacity        INTEGER NOT NULL DEFAULT 30 CHECK (capacity > 0),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_org ON rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_rooms_campus ON rooms(campus);

-- ── Duty Shifts (Scheduled rosters) ───────────────────────────
CREATE TABLE IF NOT EXISTS duty_shifts (
    id                    BIGSERIAL PRIMARY KEY,
    organization_id       BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    room_id               VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    assigned_student_id   VARCHAR(64) NOT NULL,
    assigned_student_name VARCHAR(255) NOT NULL,
    day_of_week           SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday ... 7=Sunday
    start_time            TIME NOT NULL,
    end_time              TIME NOT NULL,
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_room_day ON duty_shifts(room_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_shifts_student ON duty_shifts(assigned_student_id);

-- ── Presence Logs (Immutable audit trail of entries & exits) ──
CREATE TABLE IF NOT EXISTS duty_presence_logs (
    id                BIGSERIAL PRIMARY KEY,
    organization_id   BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    room_id           VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    student_id        VARCHAR(64) NOT NULL,
    student_name      VARCHAR(255) NOT NULL,
    check_in_at       TIMESTAMPTZ NOT NULL,
    check_out_at      TIMESTAMPTZ,
    duration_seconds  INTEGER,
    scan_method       VARCHAR(32) NOT NULL DEFAULT 'BARCODE', -- BARCODE, MANUAL, OFFLINE_SYNC
    is_on_duty        BOOLEAN NOT NULL DEFAULT false,
    client_scan_uuid  VARCHAR(64),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_room_checkin ON duty_presence_logs(room_id, check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_presence_student ON duty_presence_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_presence_client_uuid ON duty_presence_logs(client_scan_uuid);
