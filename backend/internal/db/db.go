package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/lib/pq"
)

// Connect opens a PostgreSQL connection pool using DB_* env vars.
func Connect() *sql.DB {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	sslmode := os.Getenv("DB_SSL_MODE")
	if sslmode == "" {
		sslmode = "disable"
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("[DB] Failed to open connection: %v", err)
	}

	maxOpen, _ := strconv.Atoi(os.Getenv("DB_MAX_OPEN_CONNS"))
	if maxOpen == 0 {
		maxOpen = 25
	}
	maxIdle, _ := strconv.Atoi(os.Getenv("DB_MAX_IDLE_CONNS"))
	if maxIdle == 0 {
		maxIdle = 5
	}
	db.SetMaxOpenConns(maxOpen)
	db.SetMaxIdleConns(maxIdle)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Printf("[DB] Warning: initial ping failed (will retry): %v", err)
	} else {
		log.Println("[DB] PostgreSQL connected successfully")
	}
	return db
}

// RunMigrations runs the V001 schema creation idempotently.
// V002+ are appended here as forward-only additions.
func RunMigrations(db *sql.DB) error {
	v001 := `
	CREATE TABLE IF NOT EXISTS organizations (
		id          BIGINT PRIMARY KEY,
		slug        VARCHAR(64) UNIQUE NOT NULL,
		name        VARCHAR(255) NOT NULL,
		description TEXT,
		is_active   BOOLEAN NOT NULL DEFAULT true,
		created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS rooms (
		id              VARCHAR(64) PRIMARY KEY,
		organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
		campus          VARCHAR(64) NOT NULL,
		building        VARCHAR(64) NOT NULL,
		room_number     VARCHAR(32) NOT NULL,
		name            VARCHAR(128) NOT NULL,
		capacity        INTEGER NOT NULL DEFAULT 30 CHECK (capacity > 0),
		is_active       BOOLEAN NOT NULL DEFAULT true,
		created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_rooms_org ON rooms(organization_id);
	CREATE INDEX IF NOT EXISTS idx_rooms_campus ON rooms(campus);

	CREATE TABLE IF NOT EXISTS duty_shifts (
		id                    BIGSERIAL PRIMARY KEY,
		organization_id       BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
		room_id               VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
		assigned_student_id   VARCHAR(64) NOT NULL,
		assigned_student_name VARCHAR(255) NOT NULL,
		day_of_week           SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
		start_time            TIME NOT NULL,
		end_time              TIME NOT NULL,
		is_active             BOOLEAN NOT NULL DEFAULT true,
		created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_shifts_room_day ON duty_shifts(room_id, day_of_week);
	CREATE INDEX IF NOT EXISTS idx_shifts_student ON duty_shifts(assigned_student_id);

	CREATE TABLE IF NOT EXISTS duty_presence_logs (
		id                BIGSERIAL PRIMARY KEY,
		organization_id   BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
		room_id           VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
		student_id        VARCHAR(64) NOT NULL,
		student_name      VARCHAR(255) NOT NULL,
		check_in_at       TIMESTAMPTZ NOT NULL,
		check_out_at      TIMESTAMPTZ,
		duration_seconds  INTEGER,
		scan_method       VARCHAR(32) NOT NULL DEFAULT 'BARCODE',
		is_on_duty        BOOLEAN NOT NULL DEFAULT false,
		client_scan_uuid  VARCHAR(64),
		created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_presence_room_checkin ON duty_presence_logs(room_id, check_in_at DESC);
	CREATE INDEX IF NOT EXISTS idx_presence_student ON duty_presence_logs(student_id);
	CREATE INDEX IF NOT EXISTS idx_presence_client_uuid ON duty_presence_logs(client_scan_uuid);
	`

	if _, err := db.Exec(v001); err != nil {
		return fmt.Errorf("V001 migration: %w", err)
	}

	v002 := `
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

	ALTER TABLE duty_presence_logs ADD COLUMN IF NOT EXISTS scanner_id VARCHAR(64);
	ALTER TABLE duty_presence_logs ADD COLUMN IF NOT EXISTS scanner_name VARCHAR(255);
	ALTER TABLE duty_presence_logs ADD COLUMN IF NOT EXISTS is_valid_member BOOLEAN NOT NULL DEFAULT true;

	CREATE INDEX IF NOT EXISTS idx_presence_valid_member ON duty_presence_logs(room_id, is_valid_member);
	CREATE INDEX IF NOT EXISTS idx_presence_scanner ON duty_presence_logs(scanner_id);

	CREATE TABLE IF NOT EXISTS duty_shift_records (
		id               BIGSERIAL PRIMARY KEY,
		organization_id  BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
		room_id          VARCHAR(64) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
		duty_staff_id    VARCHAR(64) NOT NULL,
		duty_staff_name  VARCHAR(255) NOT NULL,
		duty_staff_email VARCHAR(255),
		start_time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		end_time         TIMESTAMPTZ,
		status           VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
		created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_shift_records_room ON duty_shift_records(room_id, start_time DESC);
	CREATE INDEX IF NOT EXISTS idx_shift_records_org ON duty_shift_records(organization_id);
	CREATE INDEX IF NOT EXISTS idx_shift_records_staff ON duty_shift_records(duty_staff_id, status);
	`

	if _, err := db.Exec(v002); err != nil {
		return fmt.Errorf("V002 migration: %w", err)
	}

	v003 := `
	ALTER TABLE duty_presence_logs ADD COLUMN IF NOT EXISTS is_system_user BOOLEAN NOT NULL DEFAULT false;
	CREATE INDEX IF NOT EXISTS idx_presence_system_user ON duty_presence_logs(room_id, is_system_user);
	CREATE INDEX IF NOT EXISTS idx_presence_dedup ON duty_presence_logs(room_id, student_id, check_in_at DESC);
	UPDATE duty_presence_logs SET is_system_user = true WHERE is_valid_member = true;
	`

	if _, err := db.Exec(v003); err != nil {
		return fmt.Errorf("V003 migration: %w", err)
	}

	log.Println("[DB] Migrations applied successfully")
	return nil
}
