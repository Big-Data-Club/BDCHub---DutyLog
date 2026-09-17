package handler

import (
	"context"
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/model"
)

// HandleAdminInspectionHierarchy returns the full bottom-up inspection hierarchy:
// Org -> Rooms with live occupancy and status.
// GET /api/v1/admin/inspection/hierarchy
func HandleAdminInspectionHierarchy(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		orgRows, err := db.QueryContext(ctx, `
			SELECT id, slug, name, COALESCE(description, ''), is_active
			FROM organizations
			WHERE is_active = true
			ORDER BY id ASC
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer orgRows.Close()

		type AdminOrgNode struct {
			ID          int64        `json:"id"`
			Slug        string       `json:"slug"`
			Name        string       `json:"name"`
			Description string       `json:"description"`
			IsActive    bool         `json:"is_active"`
			Rooms       []model.Room `json:"rooms"`
		}

		var orgNodes []AdminOrgNode
		for orgRows.Next() {
			var node AdminOrgNode
			if err := orgRows.Scan(&node.ID, &node.Slug, &node.Name, &node.Description, &node.IsActive); err != nil {
				continue
			}
			node.Rooms = []model.Room{}
			orgNodes = append(orgNodes, node)
		}

		// Fetch rooms for each org
		for i := range orgNodes {
			rRows, rErr := db.QueryContext(ctx, `
				SELECT id, organization_id, campus, building, room_number, name, capacity, is_active
				FROM rooms
				WHERE organization_id = $1 AND is_active = true
				ORDER BY campus, room_number ASC
			`, orgNodes[i].ID)
			if rErr == nil {
				for rRows.Next() {
					var r model.Room
					if err := rRows.Scan(&r.ID, &r.OrganizationID, &r.Campus, &r.Building, &r.RoomNumber, &r.Name, &r.Capacity, &r.IsActive); err == nil {
						orgNodes[i].Rooms = append(orgNodes[i].Rooms, r)
					}
				}
				rRows.Close()
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"hierarchy": orgNodes,
		})
	}
}

// HandleAdminRoomPresenceHistory returns check-in/check-out logs with scanner identity & membership validity.
// Records with is_valid_member = false must be highlighted in RED on admin dashboard.
// GET /api/v1/admin/rooms/:room_id/presence-history
func HandleAdminRoomPresenceHistory(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		limitStr := c.DefaultQuery("limit", "100")
		offsetStr := c.DefaultQuery("offset", "0")
		limit, _ := strconv.Atoi(limitStr)
		offset, _ := strconv.Atoi(offsetStr)
		if limit <= 0 || limit > 500 {
			limit = 100
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := db.QueryContext(ctx, `
			SELECT id, organization_id, room_id, student_id, student_name, check_in_at, check_out_at,
			       duration_seconds, scan_method, is_on_duty, COALESCE(scanner_id, ''), COALESCE(scanner_name, ''),
			       is_valid_member, created_at
			FROM duty_presence_logs
			WHERE room_id = $1
			ORDER BY check_in_at DESC
			LIMIT $2 OFFSET $3
		`, roomID, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		items := make([]model.PresenceHistoryItem, 0)
		for rows.Next() {
			var item model.PresenceHistoryItem
			var checkOutAt sql.NullTime
			var durationSec sql.NullInt64

			if err := rows.Scan(
				&item.ID, &item.OrganizationID, &item.RoomID,
				&item.StudentID, &item.StudentName, &item.CheckInAt, &checkOutAt,
				&durationSec, &item.ScanMethod, &item.IsOnDuty,
				&item.ScannerID, &item.ScannerName, &item.IsValidMember, &item.CreatedAt,
			); err != nil {
				continue
			}

			if checkOutAt.Valid {
				item.CheckOutAt = &checkOutAt.Time
			}
			if durationSec.Valid {
				d := durationSec.Int64
				item.DurationSeconds = &d
			}
			items = append(items, item)
		}

		c.JSON(http.StatusOK, gin.H{
			"room_id":  roomID,
			"count":    len(items),
			"history":  items,
		})
	}
}

// HandleAdminRoomDutyHistory returns the historical duty shifts with start and end times.
// GET /api/v1/admin/rooms/:room_id/duty-history
func HandleAdminRoomDutyHistory(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		limitStr := c.DefaultQuery("limit", "100")
		offsetStr := c.DefaultQuery("offset", "0")
		limit, _ := strconv.Atoi(limitStr)
		offset, _ := strconv.Atoi(offsetStr)
		if limit <= 0 || limit > 500 {
			limit = 100
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := db.QueryContext(ctx, `
			SELECT id, organization_id, room_id, duty_staff_id, duty_staff_name,
			       COALESCE(duty_staff_email, ''), start_time, end_time, status, created_at
			FROM duty_shift_records
			WHERE room_id = $1
			ORDER BY start_time DESC
			LIMIT $2 OFFSET $3
		`, roomID, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		shifts := make([]model.DutyShiftRecord, 0)
		for rows.Next() {
			var s model.DutyShiftRecord
			var endTime sql.NullTime

			if err := rows.Scan(
				&s.ID, &s.OrganizationID, &s.RoomID,
				&s.DutyStaffID, &s.DutyStaffName, &s.DutyStaffEmail,
				&s.StartTime, &endTime, &s.Status, &s.CreatedAt,
			); err != nil {
				continue
			}

			if endTime.Valid {
				s.EndTime = &endTime.Time
				s.DurationSeconds = int64(endTime.Time.Sub(s.StartTime).Seconds())
			} else {
				s.DurationSeconds = int64(time.Now().UTC().Sub(s.StartTime).Seconds())
			}

			shifts = append(shifts, s)
		}

		c.JSON(http.StatusOK, gin.H{
			"room_id":  roomID,
			"count":    len(shifts),
			"shifts":   shifts,
		})
	}
}
