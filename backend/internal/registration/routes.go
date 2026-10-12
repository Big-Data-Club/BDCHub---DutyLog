package registration

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/lib/pq"
)

var hcm = time.FixedZone("ICT", 7*60*60)

// RegisterRoutes adds only new endpoints; all existing /api/v1 routes stay unchanged.
func RegisterRoutes(api *gin.RouterGroup, db *sql.DB) {
	api.GET("/orgs/:org_id/rooms/:room_id/availability", middleware.RequireAuth(), func(c *gin.Context) { availability(c, db) })
	api.POST("/duty-registrations", middleware.RequireAuth(), func(c *gin.Context) { create(c, db) })
	api.GET("/me/duty-registrations", middleware.RequireAuth(), func(c *gin.Context) { mine(c, db) })
	api.DELETE("/duty-registrations/:id", middleware.RequireAuth(), func(c *gin.Context) { cancel(c, db) })
	api.POST("/admin/shift-slots", middleware.RequireAdminJWT(), func(c *gin.Context) { createSlot(c, db) })
}

type slot struct {
	ID        int64  `json:"id"`
	Label     string `json:"label"`
	StartsAt  string `json:"starts_at"`
	EndsAt    string `json:"ends_at"`
	Capacity  int    `json:"capacity"`
	Remaining int    `json:"remaining"`
	Status    string `json:"status"`
}

type registration struct {
	ID             int64     `json:"id"`
	UserID         int64     `json:"user_id"`
	OrganizationID int64     `json:"organization_id"`
	RoomID         string    `json:"room_id"`
	RoomName       string    `json:"room_name"`
	SlotID         int64     `json:"slot_id"`
	Label          string    `json:"label"`
	DutyDate       string    `json:"duty_date"`
	StartsAt       string    `json:"starts_at"`
	EndsAt         string    `json:"ends_at"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

func parseDate(s string) (time.Time, error) {
	if len(s) != 10 {
		return time.Time{}, errors.New("date must be YYYY-MM-DD")
	}
	date, err := time.ParseInLocation("2006-01-02", s, hcm)
	if err != nil || date.Format("2006-01-02") != s {
		return time.Time{}, errors.New("invalid date")
	}
	return date, nil
}
func validDate(date time.Time) bool {
	today, _ := parseDate(time.Now().In(hcm).Format("2006-01-02"))
	return !date.Before(today) && !date.After(today.AddDate(0, 0, 90))
}
func scheduledAt(date time.Time, hour string) (time.Time, error) {
	clock, err := time.Parse("15:04", hour)
	if err != nil {
		return time.Time{}, err
	}
	return time.Date(date.Year(), date.Month(), date.Day(), clock.Hour(), clock.Minute(), 0, 0, hcm), nil
}
func fail(c *gin.Context, code int, message string) { c.JSON(code, gin.H{"error": message}) }
func userID(c *gin.Context) int64                   { return c.GetInt64("user_id") }

func availability(c *gin.Context, db *sql.DB) {
	orgID, err := strconv.ParseInt(c.Param("org_id"), 10, 64)
	if err != nil || orgID <= 0 {
		fail(c, 400, "invalid organization")
		return
	}
	date, err := parseDate(c.Query("date"))
	if err != nil || !validDate(date) {
		fail(c, 400, "date must be within next 90 days")
		return
	}
	roomID := c.Param("room_id")
	var allowed bool
	err = db.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM rooms r JOIN organization_members m ON m.organization_id=r.organization_id AND m.user_id=$3 WHERE r.id=$1 AND r.organization_id=$2 AND r.is_active)`, roomID, orgID, userID(c)).Scan(&allowed)
	if err != nil {
		fail(c, 500, "availability unavailable")
		return
	}
	if !allowed {
		fail(c, 403, "room membership required")
		return
	}
	rows, err := db.QueryContext(c.Request.Context(), `SELECT s.id, s.label, TO_CHAR(s.starts_at,'HH24:MI'), TO_CHAR(s.ends_at,'HH24:MI'), s.capacity,
  s.capacity - COUNT(r.id)::integer AS remaining
  FROM duty_slots s LEFT JOIN duty_registrations r ON r.slot_id=s.id AND r.duty_date=$2::date AND r.status='BOOKED'
  WHERE s.room_id=$1 AND s.weekday=$3 AND s.is_active
  GROUP BY s.id ORDER BY s.starts_at`, roomID, c.Query("date"), isoDay(date))
	if err != nil {
		fail(c, 500, "availability unavailable")
		return
	}
	defer rows.Close()
	slots := make([]slot, 0)
	for rows.Next() {
		var s slot
		if err := rows.Scan(&s.ID, &s.Label, &s.StartsAt, &s.EndsAt, &s.Capacity, &s.Remaining); err != nil {
			fail(c, 500, "availability unavailable")
			return
		}
		at, _ := scheduledAt(date, s.StartsAt)
		switch {
		case !at.After(time.Now()):
			s.Status = "STARTED"
		case s.Remaining <= 0:
			s.Status = "FULL"
		default:
			s.Status = "OPEN"
		}
		slots = append(slots, s)
	}
	if rows.Err() != nil {
		fail(c, 500, "availability unavailable")
		return
	}
	c.JSON(200, gin.H{"organization_id": orgID, "room_id": roomID, "date": c.Query("date"), "timezone": "Asia/Ho_Chi_Minh", "slots": slots})
}
func isoDay(t time.Time) int { return (int(t.Weekday())+6)%7 + 1 }

type createRequest struct {
	OrganizationID int64  `json:"organization_id" binding:"required"`
	RoomID         string `json:"room_id" binding:"required"`
	SlotID         int64  `json:"slot_id" binding:"required"`
	Date           string `json:"date" binding:"required"`
}

func create(c *gin.Context, db *sql.DB) {
	var req createRequest
	if c.ShouldBindJSON(&req) != nil || req.OrganizationID <= 0 || strings.TrimSpace(req.RoomID) == "" {
		fail(c, 400, "invalid booking payload")
		return
	}
	date, err := parseDate(req.Date)
	if err != nil || !validDate(date) {
		fail(c, 400, "invalid booking date")
		return
	}
	key := strings.TrimSpace(c.GetHeader("Idempotency-Key"))
	if len(key) < 16 || len(key) > 100 {
		fail(c, 400, "Idempotency-Key required (16..100 chars)")
		return
	}
	uid := userID(c)
	if uid <= 0 {
		fail(c, 401, "authenticated identity required")
		return
	}
	ctx := c.Request.Context()
	tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		fail(c, 500, "transaction unavailable")
		return
	}
	defer tx.Rollback()
	// Serialize all of this user's bookings (prevents cross-room/slot overlap races).
	if _, err = tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock($1)`, uid); err != nil {
		fail(c, 500, "booking unavailable")
		return
	}
	var previous registration
	err = tx.QueryRowContext(ctx, `SELECT id, room_id, slot_id, TO_CHAR(duty_date,'YYYY-MM-DD'), status FROM duty_registrations WHERE user_id=$1 AND idempotency_key=$2`, uid, key).Scan(&previous.ID, &previous.RoomID, &previous.SlotID, &previous.DutyDate, &previous.Status)
	if err == nil {
		if previous.RoomID != req.RoomID || previous.SlotID != req.SlotID || previous.DutyDate != req.Date {
			fail(c, 409, "idempotency key used for another booking")
			return
		}
		if err = tx.Commit(); err != nil {
			fail(c, 500, "booking unavailable")
			return
		}
		c.JSON(200, gin.H{"id": previous.ID, "status": previous.Status, "room_id": previous.RoomID, "slot_id": previous.SlotID, "duty_date": previous.DutyDate, "replayed": true})
		return
	}
	if err != sql.ErrNoRows {
		fail(c, 500, "booking unavailable")
		return
	}
	var permitted bool
	err = tx.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM rooms r JOIN organizations o ON o.id=r.organization_id AND o.is_active JOIN organization_members m ON m.organization_id=r.organization_id AND m.user_id=$3 WHERE r.id=$1 AND r.organization_id=$2 AND r.is_active)`, req.RoomID, req.OrganizationID, uid).Scan(&permitted)
	if err != nil {
		fail(c, 500, "booking unavailable")
		return
	}
	if !permitted {
		fail(c, 403, "organization membership required")
		return
	}
	var roomID string
	var orgID int64
	var weekday, capacity int
	var from, to string
	err = tx.QueryRowContext(ctx, `SELECT room_id, organization_id, weekday, TO_CHAR(starts_at,'HH24:MI'), TO_CHAR(ends_at,'HH24:MI'), capacity FROM duty_slots WHERE id=$1 AND is_active FOR UPDATE`, req.SlotID).Scan(&roomID, &orgID, &weekday, &from, &to, &capacity)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, 404, "slot not found")
		return
	}
	if err != nil {
		fail(c, 500, "booking unavailable")
		return
	}
	if roomID != req.RoomID || orgID != req.OrganizationID || weekday != isoDay(date) {
		fail(c, 400, "slot does not match room/weekday")
		return
	}
	starts, _ := scheduledAt(date, from)
	if !starts.After(time.Now()) {
		fail(c, 409, "slot has already started")
		return
	}
	var booked int
	if err = tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM duty_registrations WHERE slot_id=$1 AND duty_date=$2::date AND status='BOOKED'`, req.SlotID, req.Date).Scan(&booked); err != nil {
		fail(c, 500, "booking unavailable")
		return
	}
	if booked >= capacity {
		fail(c, 409, "slot is full")
		return
	}
	var conflict bool
	err = tx.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM duty_registrations b JOIN duty_slots s ON s.id=b.slot_id WHERE b.user_id=$1 AND b.duty_date=$2::date AND b.status='BOOKED' AND s.starts_at < $3::time AND s.ends_at > $4::time)`, uid, req.Date, to, from).Scan(&conflict)
	if err != nil {
		fail(c, 500, "booking unavailable")
		return
	}
	if conflict {
		fail(c, 409, "overlapping booking exists")
		return
	}
	var id int64
	err = tx.QueryRowContext(ctx, `INSERT INTO duty_registrations(user_id,organization_id,room_id,slot_id,duty_date,idempotency_key) VALUES ($1,$2,$3,$4,$5::date,$6) RETURNING id`, uid, req.OrganizationID, req.RoomID, req.SlotID, req.Date, key).Scan(&id)
	if err != nil {
		fail(c, 500, "booking unavailable")
		return
	}
	if err = tx.Commit(); err != nil {
		fail(c, 500, "booking unavailable")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "status": "BOOKED", "room_id": req.RoomID, "slot_id": req.SlotID, "duty_date": req.Date, "replayed": false})
}
func mine(c *gin.Context, db *sql.DB) {
	if userID(c) <= 0 {
		fail(c, 401, "authenticated identity required")
		return
	}
	rows, err := db.QueryContext(c.Request.Context(), `SELECT b.id,b.user_id,b.organization_id,b.room_id,r.name,b.slot_id,s.label,TO_CHAR(b.duty_date,'YYYY-MM-DD'),TO_CHAR(s.starts_at,'HH24:MI'),TO_CHAR(s.ends_at,'HH24:MI'),b.status,b.created_at FROM duty_registrations b JOIN rooms r ON r.id=b.room_id JOIN duty_slots s ON s.id=b.slot_id WHERE b.user_id=$1 ORDER BY b.duty_date DESC,s.starts_at DESC LIMIT 100`, userID(c))
	if err != nil {
		fail(c, 500, "bookings unavailable")
		return
	}
	defer rows.Close()
	list := make([]registration, 0)
	for rows.Next() {
		var r registration
		if err = rows.Scan(&r.ID, &r.UserID, &r.OrganizationID, &r.RoomID, &r.RoomName, &r.SlotID, &r.Label, &r.DutyDate, &r.StartsAt, &r.EndsAt, &r.Status, &r.CreatedAt); err != nil {
			fail(c, 500, "bookings unavailable")
			return
		}
		list = append(list, r)
	}
	if rows.Err() != nil {
		fail(c, 500, "bookings unavailable")
		return
	}
	c.JSON(200, gin.H{"registrations": list})
}
func cancel(c *gin.Context, db *sql.DB) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		fail(c, 400, "invalid registration id")
		return
	}
	uid := userID(c)
	tx, err := db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		fail(c, 500, "cancellation unavailable")
		return
	}
	defer tx.Rollback()
	var status, day, from string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT b.status,TO_CHAR(b.duty_date,'YYYY-MM-DD'),TO_CHAR(s.starts_at,'HH24:MI') FROM duty_registrations b JOIN duty_slots s ON s.id=b.slot_id WHERE b.id=$1 AND b.user_id=$2 FOR UPDATE OF b`, id, uid).Scan(&status, &day, &from)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, 404, "registration not found")
		return
	}
	if err != nil {
		fail(c, 500, "cancellation unavailable")
		return
	}
	if status == "CANCELLED" {
		if err = tx.Commit(); err != nil {
			fail(c, 500, "cancellation unavailable")
			return
		}
		c.JSON(200, gin.H{"id": id, "status": "CANCELLED"})
		return
	}
	date, _ := parseDate(day)
	start, _ := scheduledAt(date, from)
	if time.Until(start) < 30*time.Minute {
		fail(c, 409, "cancellation deadline passed (30 minutes before start)")
		return
	}
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE duty_registrations SET status='CANCELLED',cancelled_at=NOW() WHERE id=$1 AND user_id=$2`, id, uid)
	if err != nil {
		fail(c, 500, "cancellation unavailable")
		return
	}
	if err = tx.Commit(); err != nil {
		fail(c, 500, "cancellation unavailable")
		return
	}
	c.JSON(200, gin.H{"id": id, "status": "CANCELLED"})
}

type slotRequest struct {
	OrganizationID int64  `json:"organization_id" binding:"required"`
	RoomID         string `json:"room_id" binding:"required"`
	Weekday        int    `json:"weekday" binding:"required"`
	Label          string `json:"label" binding:"required"`
	StartsAt       string `json:"starts_at" binding:"required"`
	EndsAt         string `json:"ends_at" binding:"required"`
	Capacity       int    `json:"capacity" binding:"required"`
}

func createSlot(c *gin.Context, db *sql.DB) {
	var r slotRequest
	if c.ShouldBindJSON(&r) != nil || r.Weekday < 1 || r.Weekday > 7 || r.Capacity <= 0 || len(strings.TrimSpace(r.Label)) > 60 {
		fail(c, 400, "invalid slot data")
		return
	}
	from, err := time.Parse("15:04", r.StartsAt)
	if err != nil {
		fail(c, 400, "invalid start time")
		return
	}
	to, err := time.Parse("15:04", r.EndsAt)
	if err != nil || !to.After(from) {
		fail(c, 400, "end must be after start")
		return
	}
	// SUPER_ADMIN can manage any organization; other admins/managers must be
	// explicitly assigned a management role in the organization being edited.
	claimsRaw, _ := c.Get("claims")
	claims, _ := claimsRaw.(jwt.MapClaims)
	isSuper := false
	if singular, ok := claims["role"].(string); ok && strings.TrimPrefix(strings.ToUpper(singular), "ROLE_") == "SUPER_ADMIN" {
		isSuper = true
	}
	if roles, ok := claims["roles"].([]interface{}); ok {
		for _, raw := range roles {
			if str, ok := raw.(string); ok && strings.TrimPrefix(strings.ToUpper(str), "ROLE_") == "SUPER_ADMIN" {
				isSuper = true
			}
		}
	}
	if !isSuper {
		var manages bool
		err := db.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM organization_members WHERE organization_id=$1 AND user_id=$2 AND UPPER(org_role) IN ('ADMIN','MANAGER','OWNER','LEAD'))`, r.OrganizationID, userID(c)).Scan(&manages)
		if err != nil {
			fail(c, 500, "permission lookup unavailable")
			return
		}
		if !manages {
			fail(c, 403, "organization manager required")
			return
		}
	}
	var roomCapacity int
	err = db.QueryRowContext(c.Request.Context(), `SELECT capacity FROM rooms WHERE id=$1 AND organization_id=$2 AND is_active`, r.RoomID, r.OrganizationID).Scan(&roomCapacity)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, 404, "room not found")
		return
	}
	if err != nil {
		fail(c, 500, "slot unavailable")
		return
	}
	if r.Capacity > roomCapacity {
		fail(c, 400, fmt.Sprintf("slot capacity exceeds room capacity %d", roomCapacity))
		return
	}
	var id int64
	err = db.QueryRowContext(c.Request.Context(), `INSERT INTO duty_slots(organization_id,room_id,weekday,label,starts_at,ends_at,capacity) VALUES($1,$2,$3,$4,$5::time,$6::time,$7) RETURNING id`, r.OrganizationID, r.RoomID, r.Weekday, strings.TrimSpace(r.Label), r.StartsAt, r.EndsAt, r.Capacity).Scan(&id)
	if err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && string(pgErr.Code) == "23505" {
			fail(c, 409, "slot conflicts with existing timetable")
		} else {
			fail(c, 500, "slot unavailable")
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "status": "ACTIVE"})
}
