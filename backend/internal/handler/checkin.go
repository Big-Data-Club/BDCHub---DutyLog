package handler

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/model"
	dutySync "github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/sync"
)

// performCheckinDB writes a presence log row and updates the Redis active sorted set.
// It verifies whether the student belongs to the organization and logs scanner identity.
func performCheckinDB(
	ctx context.Context,
	db *sql.DB,
	rds *redis.Client,
	syncService *dutySync.OrgSyncService,
	roomID, studentID, studentName, scanMethod, scannerID, scannerName string,
	now time.Time,
) (*model.CheckInResponse, error) {
	// 1. Resolve organisation from room
	var orgID int64
	err := db.QueryRowContext(ctx,
		`SELECT organization_id FROM rooms WHERE id = $1 AND is_active = true`,
		roomID,
	).Scan(&orgID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("room %s not found or inactive", roomID)
	}
	if err != nil {
		return nil, fmt.Errorf("room lookup: %w", err)
	}

	// 2. Verify Membership in current Organization
	var isValidMember = true
	var alertColor = "GREEN"
	var alertMessage = "Xác nhận hợp lệ: Thành viên thuộc tổ chức"

	if syncService != nil {
		isMember, memberName, _, vErr := syncService.VerifyMembership(ctx, orgID, studentID)
		if vErr != nil {
			log.Printf("[CHECKIN] Membership verification check error: %v", vErr)
		} else if !isMember {
			isValidMember = false
			alertColor = "RED"
			alertMessage = fmt.Sprintf("CẢNH BÁO: Mã sinh viên %s KHÔNG thuộc tổ chức này!", studentID)
		} else {
			isValidMember = true
			if memberName != "" && (studentName == "" || strings.HasPrefix(studentName, "Student ")) {
				studentName = memberName
			}
			alertMessage = fmt.Sprintf("Xác nhận hợp lệ: %s thuộc tổ chức", studentName)
		}
	}

	// 3. Determine whether this student is on a scheduled duty shift right now
	var isOnDuty bool
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday = 7 (ISO 8601)
	}
	timeNow := now.Format("15:04:05")
	err = db.QueryRowContext(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM duty_shifts
			WHERE room_id = $1
			  AND assigned_student_id = $2
			  AND day_of_week = $3
			  AND start_time <= $4::TIME
			  AND end_time >= $4::TIME
			  AND is_active = true
		)
	`, roomID, studentID, weekday, timeNow).Scan(&isOnDuty)
	if err != nil {
		log.Printf("[CHECKIN] duty shift check error (non-fatal): %v", err)
		isOnDuty = false
	}

	// 4. Insert presence log with scanner identity and validity flag
	var presenceID int64
	err = db.QueryRowContext(ctx, `
		INSERT INTO duty_presence_logs
			(organization_id, room_id, student_id, student_name, check_in_at, scan_method, is_on_duty, scanner_id, scanner_name, is_valid_member)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`, orgID, roomID, studentID, studentName, now, scanMethod, isOnDuty, scannerID, scannerName, isValidMember).Scan(&presenceID)
	if err != nil {
		return nil, fmt.Errorf("insert presence log: %w", err)
	}

	// 5. Add to Redis ZSET: dutylog:room:{room_id}:active
	//    Member format: "{student_id}:{student_name}:{scan_method}:{is_valid_member}"
	redisKey := fmt.Sprintf("dutylog:room:%s:active", roomID)
	member := fmt.Sprintf("%s:%s:%s:%t", studentID, studentName, scanMethod, isValidMember)
	rds.ZAdd(ctx, redisKey, redis.Z{
		Score:  float64(now.UnixMilli()),
		Member: member,
	})

	// 6. Live occupancy count
	occupancy, _ := rds.ZCard(ctx, redisKey).Result()

	return &model.CheckInResponse{
		Success:              true,
		PresenceID:           presenceID,
		RoomID:               roomID,
		StudentID:            studentID,
		StudentName:          studentName,
		CheckInAt:            now,
		IsOnDuty:             isOnDuty,
		CurrentRoomOccupancy: int(occupancy),
		IsValidMember:        isValidMember,
		AlertColor:           alertColor,
		AlertMessage:         alertMessage,
		ScannerID:            scannerID,
		ScannerName:          scannerName,
	}, nil
}

// HandleCheckIn processes barcode / manual entry check-in.
// POST /api/v1/rooms/:room_id/checkin
func HandleCheckIn(db *sql.DB, rds *redis.Client, syncService *dutySync.OrgSyncService) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		var req model.CheckInRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.StudentName == "" {
			req.StudentName = "Student " + req.StudentID
		}
		scanMethod := req.Method
		if scanMethod == "" {
			scanMethod = "BARCODE"
		}

		// Resolve scanner identity: from request body or authenticated context
		scannerID := req.ScannerID
		scannerName := req.ScannerName
		if scannerID == "" {
			if uid, ok := c.Get("user_id"); ok {
				scannerID = fmt.Sprintf("%v", uid)
			}
		}
		if scannerName == "" {
			if email, ok := c.Get("user_email"); ok {
				scannerName = fmt.Sprintf("%v", email)
			}
			if scannerName == "" && scannerID != "" {
				scannerName = "Staff " + scannerID
			}
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		result, err := performCheckinDB(ctx, db, rds, syncService, roomID, req.StudentID, req.StudentName, scanMethod, scannerID, scannerName, time.Now().UTC())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		log.Printf("[EVENT:dutylog.presence.v1] CHECK_IN student=%s room=%s valid_member=%t scanner=%s",
			req.StudentID, roomID, result.IsValidMember, scannerName)

		c.JSON(http.StatusOK, result)
	}
}

// HandleCheckOut processes a student exiting the room.
// POST /api/v1/rooms/:room_id/checkout
func HandleCheckOut(db *sql.DB, rds *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		var req model.CheckOutRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		now := time.Now().UTC()
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		// Find the open presence log
		var checkInAt time.Time
		var logID int64
		queryErr := db.QueryRowContext(ctx, `
			SELECT id, check_in_at FROM duty_presence_logs
			WHERE room_id = $1 AND student_id = $2 AND check_out_at IS NULL
			ORDER BY check_in_at DESC LIMIT 1
		`, roomID, req.StudentID).Scan(&logID, &checkInAt)

		var durationSec int64
		if queryErr == nil {
			durationSec = int64(now.Sub(checkInAt).Seconds())
			db.ExecContext(ctx, `
				UPDATE duty_presence_logs
				SET check_out_at = $1, duration_seconds = $2
				WHERE id = $3
			`, now, durationSec, logID)
		}

		// Remove from Redis ZSET by prefix match on student_id
		redisKey := fmt.Sprintf("dutylog:room:%s:active", roomID)
		members, _ := rds.ZRange(ctx, redisKey, 0, -1).Result()
		prefix := req.StudentID + ":"
		for _, m := range members {
			if strings.HasPrefix(m, prefix) {
				rds.ZRem(ctx, redisKey, m)
				break
			}
		}

		occupancy, _ := rds.ZCard(ctx, redisKey).Result()
		log.Printf("[EVENT:dutylog.presence.v1] CHECK_OUT student=%s room=%s duration=%ds", req.StudentID, roomID, durationSec)

		c.JSON(http.StatusOK, model.CheckOutResponse{
			Success:              true,
			RoomID:               roomID,
			StudentID:            req.StudentID,
			CheckOutAt:           now,
			DurationSeconds:      durationSec,
			CurrentRoomOccupancy: int(occupancy),
		})
	}
}

// HandleGetOccupancy returns live room occupancy from Redis ZSET.
// GET /api/v1/rooms/:room_id/occupancy
func HandleGetOccupancy(rds *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		redisKey := fmt.Sprintf("dutylog:room:%s:active", roomID)
		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		entries, _ := rds.ZRangeWithScores(ctx, redisKey, 0, -1).Result()
		occupants := make([]model.RoomOccupant, 0, len(entries))
		for _, z := range entries {
			m := z.Member.(string)
			parts := strings.Split(m, ":")
			if len(parts) < 2 {
				continue
			}
			isValid := true
			if len(parts) >= 4 {
				isValid = (parts[3] == "true")
			}
			occupants = append(occupants, model.RoomOccupant{
				StudentID:     parts[0],
				StudentName:   parts[1],
				CheckInAt:     time.UnixMilli(int64(z.Score)).UTC(),
				IsOnDuty:      false,
				IsValidMember: isValid,
			})
		}

		c.JSON(http.StatusOK, model.RoomOccupancyResponse{
			RoomID:         roomID,
			OccupancyCount: len(occupants),
			Occupants:      occupants,
		})
	}
}
