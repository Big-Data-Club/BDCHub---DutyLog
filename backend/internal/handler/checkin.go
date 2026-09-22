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
// performCheckinDB writes a presence log row and updates the Redis active sorted set.
// It verifies whether the student exists on the system, belongs to the organization,
// and enforces strict deduplication against rapid double-scanning.
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

	// 2. Strict Deduplication Guard:
	// Prevent duplicate check-in if student checked in within last 30 seconds
	// or currently has an active un-checked-out presence log in this room.
	var existingID int64
	var existingCheckInAt time.Time
	var existingName string
	var existingValidMember bool
	var existingSystemUser bool
	dedupErr := db.QueryRowContext(ctx, `
		SELECT id, check_in_at, student_name, is_valid_member, COALESCE(is_system_user, is_valid_member)
		FROM duty_presence_logs
		WHERE room_id = $1 AND student_id = $2
		  AND (check_out_at IS NULL OR check_in_at >= $3)
		ORDER BY check_in_at DESC LIMIT 1
	`, roomID, studentID, now.Add(-30*time.Second)).Scan(&existingID, &existingCheckInAt, &existingName, &existingValidMember, &existingSystemUser)

	if dedupErr == nil && existingID > 0 {
		redisKey := fmt.Sprintf("dutylog:room:%s:active", roomID)
		occupancy, _ := rds.ZCard(ctx, redisKey).Result()
		log.Printf("[CHECKIN_DEDUP] Duplicate scan suppressed for student %s in room %s (original at %s)",
			studentID, roomID, existingCheckInAt.Format(time.RFC3339))

		alertColor := "GREEN"
		alertMsg := fmt.Sprintf("Đã điểm danh vào phòng lúc %s (Đã bỏ qua quét trùng lặp)", existingCheckInAt.Format("15:04:05"))
		if !existingValidMember {
			alertColor = "RED"
			alertMsg = fmt.Sprintf("Mã số %s đã được ghi nhận lúc %s (Ngoài tổ chức, bỏ qua quét trùng)", studentID, existingCheckInAt.Format("15:04:05"))
		}

		return &model.CheckInResponse{
			Success:              true,
			PresenceID:           existingID,
			RoomID:               roomID,
			StudentID:            studentID,
			StudentName:          existingName,
			CheckInAt:            existingCheckInAt,
			IsOnDuty:             false,
			CurrentRoomOccupancy: int(occupancy),
			IsValidMember:        existingValidMember,
			IsSystemUser:         existingSystemUser,
			AlertColor:           alertColor,
			AlertMessage:         alertMsg,
			ScannerID:            scannerID,
			ScannerName:          scannerName,
		}, nil
	}

	// 3. Verify Real User Existence & Membership in current Organization (NO HARDCODING)
	var isValidMember = false
	var isSystemUser = false
	var alertColor = "RED"
	var alertMessage = fmt.Sprintf("Mã số %s chưa có trên hệ thống", studentID)

	if syncService != nil {
		verifyRes, vErr := syncService.VerifyUser(ctx, orgID, studentID)
		if vErr != nil {
			log.Printf("[CHECKIN] Membership verification check error: %v", vErr)
		} else {
			isValidMember = verifyRes.IsMember
			isSystemUser = verifyRes.IsSystemUser
			if verifyRes.FullName != "" && (studentName == "" || strings.HasPrefix(studentName, "Student ")) {
				studentName = verifyRes.FullName
			}
			if isValidMember {
				alertColor = "GREEN"
				alertMessage = fmt.Sprintf("Xác nhận hợp lệ: %s thuộc tổ chức", studentName)
			} else if isSystemUser {
				alertColor = "RED"
				alertMessage = fmt.Sprintf("Người dùng %s đã có tài khoản trên hệ thống nhưng KHÔNG thuộc tổ chức này", studentName)
			} else {
				alertColor = "RED"
				alertMessage = fmt.Sprintf("Mã số %s chưa có tài khoản trên hệ thống và ngoài tổ chức", studentID)
			}
		}
	}

	// 4. Determine whether this student is on a scheduled duty shift right now
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

	// 5. Insert presence log with scanner identity, validity flag, and system user flag
	var presenceID int64
	err = db.QueryRowContext(ctx, `
		INSERT INTO duty_presence_logs
			(organization_id, room_id, student_id, student_name, check_in_at, scan_method, is_on_duty, scanner_id, scanner_name, is_valid_member, is_system_user)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`, orgID, roomID, studentID, studentName, now, scanMethod, isOnDuty, scannerID, scannerName, isValidMember, isSystemUser).Scan(&presenceID)
	if err != nil {
		return nil, fmt.Errorf("insert presence log: %w", err)
	}

	// 6. Add to Redis ZSET: dutylog:room:{room_id}:active
	//    Member format: "{student_id}:{student_name}:{scan_method}:{is_valid_member}:{is_system_user}"
	redisKey := fmt.Sprintf("dutylog:room:%s:active", roomID)
	member := fmt.Sprintf("%s:%s:%s:%t:%t", studentID, studentName, scanMethod, isValidMember, isSystemUser)
	rds.ZAdd(ctx, redisKey, redis.Z{
		Score:  float64(now.UnixMilli()),
		Member: member,
	})

	// 7. Live occupancy count
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
		IsSystemUser:         isSystemUser,
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
			isSysUser := isValid
			if len(parts) >= 5 {
				isSysUser = (parts[4] == "true")
			}
			occupants = append(occupants, model.RoomOccupant{
				StudentID:     parts[0],
				StudentName:   parts[1],
				CheckInAt:     time.UnixMilli(int64(z.Score)).UTC(),
				IsOnDuty:      false,
				IsValidMember: isValid,
				IsSystemUser:  isSysUser,
			})
		}

		c.JSON(http.StatusOK, model.RoomOccupancyResponse{
			RoomID:         roomID,
			OccupancyCount: len(occupants),
			Occupants:      occupants,
		})
	}
}

// HandleGetStudentProfile returns full profile of a user if registered on the system.
// Matches the information card displayed on the web dashboard.
// GET /api/v1/students/:student_id/profile
func HandleGetStudentProfile(db *sql.DB, syncService *dutySync.OrgSyncService) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentID := c.Param("student_id")
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		if syncService != nil {
			profile, err := syncService.GetStudentProfile(ctx, studentID)
			if err == nil && profile != nil {
				c.JSON(http.StatusOK, gin.H{
					"exists_on_system": true,
					"profile":          profile,
				})
				return
			}
		}

		c.JSON(http.StatusNotFound, gin.H{
			"exists_on_system": false,
			"error":            "Người dùng chưa có tài khoản trên hệ thống",
		})
	}
}
