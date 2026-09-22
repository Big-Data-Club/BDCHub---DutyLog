package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	appdb "github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/db"
	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/handler"
	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/middleware"
	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/rds"
	dutySync "github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/sync"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8086"
	}
	authURL := os.Getenv("AUTH_SERVICE_URL")
	if authURL == "" {
		authURL = "http://auth-service:8080"
	}

	// ── Infrastructure connections ────────────────────────────────────────────
	db := appdb.Connect()
	defer db.Close()

	redisClient := rds.Connect()
	defer redisClient.Close()

	// ── Schema migrations (idempotent forward-only migrations) ────────────────
	if err := appdb.RunMigrations(db); err != nil {
		log.Printf("[MAIN] Warning: migration error: %v", err)
	}

	// ── Organisation & Member sync: pull from Auth Service ────────────────────
	syncService := dutySync.NewOrgSyncService(authURL, db)
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()
		orgs, err := syncService.SyncOrganizations(ctx)
		if err != nil {
			log.Printf("[MAIN] Warning: initial org sync failed (will retry): %v", err)
		} else {
			log.Printf("[MAIN] Initial org sync: %d organisations and members loaded", len(orgs))
		}
	}()
	syncService.StartPeriodicSync(context.Background(), 5*time.Minute)

	// ── Router ────────────────────────────────────────────────────────────────
	r := gin.Default()

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "dutylog-service",
			"timestamp": time.Now().UTC(),
		})
	})

	api := r.Group("/api/v1")
	{
		// Optional auth parses user claims if Authorization header present
		api.Use(middleware.OptionalAuth())

		// ── User Organization Flow (Auto-navigate if 1 org, select manually if >1) ─
		api.GET("/user/organizations", handler.HandleGetUserOrganizations(db))

		// ── Public presence endpoints (synchronous critical path) ─────────────
		api.GET("/organizations", handler.HandleGetOrganizations(db))
		api.GET("/orgs/:org_id/rooms", handler.HandleGetOrgRooms(db, redisClient))
		api.POST("/rooms/:room_id/checkin", handler.HandleCheckIn(db, redisClient, syncService))
		api.POST("/rooms/:room_id/checkout", handler.HandleCheckOut(db, redisClient))
		api.GET("/rooms/:room_id/occupancy", handler.HandleGetOccupancy(redisClient))

		// ── Duty Shifts Flow (Start shift, End shift, Get current shift) ────────
		api.POST("/rooms/:room_id/shift/start", handler.HandleStartShift(db))
		api.POST("/rooms/:room_id/shift/end", handler.HandleEndShift(db))
		api.GET("/rooms/:room_id/shift/current", handler.HandleGetCurrentShift(db))
		api.GET("/rooms/:room_id/presence-history", handler.HandleAdminRoomPresenceHistory(db))
		api.GET("/rooms/:room_id/duty-history", handler.HandleAdminRoomDutyHistory(db))

		// ── Student / User Profile Flow (Web card inspection on mobile) ───────
		api.GET("/students/:student_id/profile", handler.HandleGetStudentProfile(db, syncService))

		// ── QR flow ───────────────────────────────────────────────────────────
		// Generate a 10-second rotating QR token (called by student device)
		api.POST("/qr/generate", handler.HandleGenerateQR(redisClient))
		// Validate and check-in via QR token (called by duty-staff scanner)
		api.POST("/rooms/:room_id/checkin-qr", handler.HandleQRCheckin(db, redisClient, syncService))

		// ── Organisation & Member sync (webhook or admin trigger) ─────────────
		api.POST("/sync/organizations", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
			defer cancel()
			orgs, err := syncService.SyncOrganizations(ctx)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"message":       "Organizations and members successfully synchronized from Auth Service",
				"synced_count":  len(orgs),
				"organizations": orgs,
			})
		})

		// ── Super Admin Flow (Bottom-up System Inspection & Management) ────────
		admin := api.Group("/admin", middleware.RequireAdminJWT())
		{
			// Bottom-Up System Inspection: Org -> Room -> Duty History & Check-in/out History
			admin.GET("/inspection/hierarchy", handler.HandleAdminInspectionHierarchy(db))
			admin.GET("/rooms/:room_id/presence-history", handler.HandleAdminRoomPresenceHistory(db))
			admin.GET("/rooms/:room_id/duty-history", handler.HandleAdminRoomDutyHistory(db))

			// Room management
			admin.GET("/organizations", handler.HandleGetOrganizations(db))
			admin.GET("/orgs/:org_id/rooms", handler.HandleGetOrgRooms(db, redisClient))
			admin.POST("/orgs/:org_id/rooms", handler.HandleAdminCreateRoom(db))
			admin.PUT("/rooms/:room_id", handler.HandleAdminUpdateRoom(db))
			admin.DELETE("/rooms/:room_id", handler.HandleAdminDeleteRoom(db))
		}
	}

	log.Printf("[MAIN] DutyLog Backend starting on :%s (auth: %s)", port, authURL)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[MAIN] Server error: %v", err)
	}
}
