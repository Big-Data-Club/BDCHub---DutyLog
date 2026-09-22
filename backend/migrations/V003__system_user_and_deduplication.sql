-- ============================================================
-- DutyLog Service - V003 Database Schema Revision
-- Adds is_system_user flag to duty_presence_logs,
-- indexes for deduplication and system user query.
-- Author: BDC Dev Team
-- ============================================================

ALTER TABLE duty_presence_logs ADD COLUMN IF NOT EXISTS is_system_user BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_presence_system_user ON duty_presence_logs(room_id, is_system_user);
CREATE INDEX IF NOT EXISTS idx_presence_dedup ON duty_presence_logs(room_id, student_id, check_in_at DESC);

-- Backfill existing valid members as system users
UPDATE duty_presence_logs SET is_system_user = true WHERE is_valid_member = true;
