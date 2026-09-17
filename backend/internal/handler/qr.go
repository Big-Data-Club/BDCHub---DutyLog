package handler

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

const qrTTL = 10 * time.Second

// QRGenerateRequest is sent by the student app to obtain a rotating token.
type QRGenerateRequest struct {
	StudentID   string `json:"student_id" binding:"required"`
	StudentName string `json:"student_name" binding:"required"`
}

// QRGenerateResponse carries the signed payload and its expiry time.
type QRGenerateResponse struct {
	Payload   string    `json:"payload"`
	ExpiresAt time.Time `json:"expires_at"`
}

// QRCheckinRequest is sent by the duty-staff scanner after reading the QR code.
type QRCheckinRequest struct {
	Payload         string    `json:"payload" binding:"required"`
	ClientTimestamp time.Time `json:"client_timestamp"`
}

// qrSecret returns the HMAC key, falling back to a dev default when unset.
func qrSecret() []byte {
	s := os.Getenv("QR_SECRET")
	if s == "" {
		s = "dev-qr-secret-change-in-prod-32b"
	}
	return []byte(s)
}

// signPayload computes HMAC-SHA256 of the base64url encoded data.
func signPayload(encoded string) string {
	mac := hmac.New(sha256.New, qrSecret())
	mac.Write([]byte(encoded))
	return hex.EncodeToString(mac.Sum(nil))
}

// buildQRPayload encodes student info + timestamp and appends an HMAC signature.
// Format: base64url(student_id:student_name:unix_ms) + "." + hmac_hex
func buildQRPayload(studentID, studentName string) string {
	raw := fmt.Sprintf("%s:%s:%d", studentID, studentName, time.Now().UnixMilli())
	encoded := base64.RawURLEncoding.EncodeToString([]byte(raw))
	sig := signPayload(encoded)
	return encoded + "." + sig
}

// HandleGenerateQR issues a single-use signed QR token valid for 10 seconds.
// POST /api/v1/qr/generate
// Body: { student_id, student_name }
func HandleGenerateQR(rds *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req QRGenerateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		payload := buildQRPayload(req.StudentID, req.StudentName)
		parts := strings.SplitN(payload, ".", 2)
		if len(parts) != 2 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "token build failed"})
			return
		}
		sig := parts[1]

		// Store in Redis: key=dutylog:qr:{sig}  value=studentID:studentName  TTL=10s
		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()
		val := req.StudentID + ":" + req.StudentName
		if err := rds.Set(ctx, "dutylog:qr:"+sig, val, qrTTL).Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "redis write failed"})
			return
		}

		c.JSON(http.StatusOK, QRGenerateResponse{
			Payload:   payload,
			ExpiresAt: time.Now().UTC().Add(qrTTL),
		})
	}
}

// HandleQRCheckin validates a QR payload (HMAC + Redis) and performs check-in.
// POST /api/v1/rooms/:room_id/checkin-qr
// Body: { payload, client_timestamp }
func HandleQRCheckin(db *sql.DB, rds *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		var req QRCheckinRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 1. Split and verify HMAC (constant-time comparison)
		parts := strings.SplitN(req.Payload, ".", 2)
		if len(parts) != 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid qr payload format"})
			return
		}
		encoded, sig := parts[0], parts[1]
		expectedSig := signPayload(encoded)
		if !hmac.Equal([]byte(sig), []byte(expectedSig)) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid qr token signature"})
			return
		}

		// 2. Fetch and atomically delete from Redis (single-use token)
		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()
		redisKey := "dutylog:qr:" + sig
		val, err := rds.GetDel(ctx, redisKey).Result()
		if err == redis.Nil {
			c.JSON(http.StatusGone, gin.H{"error": "qr token expired or already used"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "redis lookup failed"})
			return
		}

		// 3. Parse stored value: "studentID:studentName"
		valParts := strings.SplitN(val, ":", 2)
		if len(valParts) != 2 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "corrupted token value"})
			return
		}
		studentID, studentName := valParts[0], valParts[1]

		// 4. Perform check-in via shared logic
		result, err := performCheckinDB(ctx, db, rds, roomID, studentID, studentName, "QR_CODE", time.Now().UTC())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, result)
	}
}
