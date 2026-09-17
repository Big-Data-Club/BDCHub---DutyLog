package handler

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/model"
)

// HandleStartShift starts a duty shift for a staff member in a room.
// POST /api/v1/rooms/:room_id/shift/start
func HandleStartShift(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		var req model.StartShiftRequest
		_ = c.ShouldBindJSON(&req)

		// If staff info not provided in body, extract from authenticated context
		if req.DutyStaffID == "" {
			if uid, ok := c.Get("user_id"); ok {
				req.DutyStaffID = fmt.Sprintf("%v", uid)
			}
		}
		if req.DutyStaffEmail == "" {
			if email, ok := c.Get("user_email"); ok {
				req.DutyStaffEmail = fmt.Sprintf("%v", email)
			}
		}
		if req.DutyStaffName == "" {
			req.DutyStaffName = req.DutyStaffEmail
			if req.DutyStaffName == "" {
				req.DutyStaffName = "Duty Staff " + req.DutyStaffID
			}
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		// Resolve org ID from room
		var orgID int64
		err := db.QueryRowContext(ctx, `SELECT organization_id FROM rooms WHERE id = $1 AND is_active = true`, roomID).Scan(&orgID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found or inactive"})
			return
		}

		now := time.Now().UTC()

		// End any stale active shifts for this staff in this room
		_, _ = db.ExecContext(ctx, `
			UPDATE duty_shift_records
			SET end_time = $1, status = 'COMPLETED'
			WHERE room_id = $2 AND duty_staff_id = $3 AND status = 'ACTIVE'
		`, now, roomID, req.DutyStaffID)

		// Insert new active shift
		var shiftID int64
		err = db.QueryRowContext(ctx, `
			INSERT INTO duty_shift_records (organization_id, room_id, duty_staff_id, duty_staff_name, duty_staff_email, start_time, status)
			VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
			RETURNING id
		`, orgID, roomID, req.DutyStaffID, req.DutyStaffName, req.DutyStaffEmail, now).Scan(&shiftID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start shift: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":          true,
			"shift_id":         shiftID,
			"room_id":          roomID,
			"organization_id":  orgID,
			"duty_staff_id":    req.DutyStaffID,
			"duty_staff_name":  req.DutyStaffName,
			"duty_staff_email": req.DutyStaffEmail,
			"start_time":       now,
			"status":           "ACTIVE",
		})
	}
}

// HandleEndShift ends an active duty shift.
// POST /api/v1/rooms/:room_id/shift/end
func HandleEndShift(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		var req model.EndShiftRequest
		_ = c.ShouldBindJSON(&req)

		if req.DutyStaffID == "" {
			if uid, ok := c.Get("user_id"); ok {
				req.DutyStaffID = fmt.Sprintf("%v", uid)
			}
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		now := time.Now().UTC()

		var shiftID int64
		var startTime time.Time
		var staffName string

		// Look for active shift to close
		var queryErr error
		if req.DutyStaffID != "" && req.DutyStaffID != "0" {
			queryErr = db.QueryRowContext(ctx, `
				SELECT id, start_time, duty_staff_name FROM duty_shift_records
				WHERE room_id = $1 AND duty_staff_id = $2 AND status = 'ACTIVE'
				ORDER BY start_time DESC LIMIT 1
			`, roomID, req.DutyStaffID).Scan(&shiftID, &startTime, &staffName)
		} else {
			// Close latest active shift in room if staff ID not specified
			queryErr = db.QueryRowContext(ctx, `
				SELECT id, start_time, duty_staff_name FROM duty_shift_records
				WHERE room_id = $1 AND status = 'ACTIVE'
				ORDER BY start_time DESC LIMIT 1
			`, roomID).Scan(&shiftID, &startTime, &staffName)
		}

		if queryErr == sql.ErrNoRows {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "No active shift found to end",
			})
			return
		}
		if queryErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "query error: " + queryErr.Error()})
			return
		}

		durationSec := int64(now.Sub(startTime).Seconds())
		_, err := db.ExecContext(ctx, `
			UPDATE duty_shift_records
			SET end_time = $1, status = 'COMPLETED'
			WHERE id = $2
		`, now, shiftID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update shift: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":          true,
			"shift_id":         shiftID,
			"room_id":          roomID,
			"duty_staff_name":  staffName,
			"start_time":       startTime,
			"end_time":         now,
			"duration_seconds": durationSec,
			"status":           "COMPLETED",
		})
	}
}

// HandleGetCurrentShift returns the active shift in the room if any.
// GET /api/v1/rooms/:room_id/shift/current
func HandleGetCurrentShift(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		var record model.DutyShiftRecord
		var endTime sql.NullTime
		err := db.QueryRowContext(ctx, `
			SELECT id, organization_id, room_id, duty_staff_id, duty_staff_name, COALESCE(duty_staff_email, ''), start_time, end_time, status
			FROM duty_shift_records
			WHERE room_id = $1 AND status = 'ACTIVE'
			ORDER BY start_time DESC LIMIT 1
		`, roomID).Scan(
			&record.ID, &record.OrganizationID, &record.RoomID,
			&record.DutyStaffID, &record.DutyStaffName, &record.DutyStaffEmail,
			&record.StartTime, &endTime, &record.Status,
		)

		if err == sql.ErrNoRows {
			c.JSON(http.StatusOK, gin.H{"has_active_shift": false})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if endTime.Valid {
			record.EndTime = &endTime.Time
		}
		record.DurationSeconds = int64(time.Now().UTC().Sub(record.StartTime).Seconds())

		c.JSON(http.StatusOK, gin.H{
			"has_active_shift": true,
			"shift":            record,
		})
	}
}

// Helper to convert string to int64 safely
func toInt64(s string) int64 {
	v, _ := strconv.ParseInt(s, 10, 64)
	return v
}
