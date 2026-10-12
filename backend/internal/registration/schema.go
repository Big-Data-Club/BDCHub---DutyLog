package registration

import (
	"database/sql"
	"fmt"
)

// Migrate is an additive V004 schema. It does not modify existing duty shift/presence tables.
func Migrate(db *sql.DB) error {
	const ddl = `
 CREATE TABLE IF NOT EXISTS duty_slots (
   id BIGSERIAL PRIMARY KEY,
   organization_id BIGINT NOT NULL REFERENCES organizations(id),
   room_id VARCHAR(64) NOT NULL REFERENCES rooms(id),
   weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
   label VARCHAR(60) NOT NULL,
   starts_at TIME NOT NULL,
   ends_at TIME NOT NULL,
   capacity INTEGER NOT NULL CHECK (capacity > 0),
   is_active BOOLEAN NOT NULL DEFAULT TRUE,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   CHECK (ends_at > starts_at),
   UNIQUE(room_id, weekday, starts_at, ends_at)
 );
 CREATE INDEX IF NOT EXISTS idx_duty_slots_availability ON duty_slots(room_id, weekday, is_active);
 CREATE TABLE IF NOT EXISTS duty_registrations (
   id BIGSERIAL PRIMARY KEY,
   user_id BIGINT NOT NULL,
   organization_id BIGINT NOT NULL REFERENCES organizations(id),
   room_id VARCHAR(64) NOT NULL REFERENCES rooms(id),
   slot_id BIGINT NOT NULL REFERENCES duty_slots(id),
   duty_date DATE NOT NULL,
   status VARCHAR(16) NOT NULL DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CANCELLED')),
   idempotency_key VARCHAR(100) NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   cancelled_at TIMESTAMPTZ,
   UNIQUE(user_id, idempotency_key)
 );
 CREATE UNIQUE INDEX IF NOT EXISTS uq_duty_active_booking ON duty_registrations(slot_id, duty_date, user_id) WHERE status = 'BOOKED';
 CREATE INDEX IF NOT EXISTS idx_duty_registrations_capacity ON duty_registrations(slot_id, duty_date) WHERE status = 'BOOKED';
 CREATE INDEX IF NOT EXISTS idx_duty_registrations_user ON duty_registrations(user_id, duty_date DESC);
 `
	if _, err := db.Exec(ddl); err != nil {
		return fmt.Errorf("V004 duty registrations: %w", err)
	}
	return nil
}
