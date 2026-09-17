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

	// ── Schema migrations (idempotent CREATE TABLE IF NOT EXISTS) ─────────────
	if err := appdb.RunMigrations(db); err != nil {
		log.Printf("[MAIN] Warning: migration error: %v", err)
	}

	// ── Organisation sync: pull from Auth Service ─────────────────────────────
	syncService := dutySync.NewOrgSyncService(authURL, db)
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		orgs, err := syncService.SyncOrganizations(ctx)
		if err != nil {
			log.Printf("[MAIN] Warning: initial org sync failed (will retry): %v", err)
		} else {
			log.Printf("[MAIN] Initial org sync: %d organisations loaded", len(orgs))
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
		// ── Public presence endpoints (synchronous critical path) ─────────────
		api.GET("/organizations", handler.HandleGetOrganizations(db))
		api.GET("/orgs/:org_id/rooms", handler.HandleGetOrgRooms(db, redisClient))
		api.POST("/rooms/:room_id/checkin", handler.HandleCheckIn(db, redisClient))
		api.POST("/rooms/:room_id/checkout", handler.HandleCheckOut(db, redisClient))
		api.GET("/rooms/:room_id/occupancy", handler.HandleGetOccupancy(redisClient))

		// ── QR flow ───────────────────────────────────────────────────────────
		// Generate a 10-second rotating QR token (called by student device)
		api.POST("/qr/generate", handler.HandleGenerateQR(redisClient))
		// Validate and check-in via QR token (called by duty-staff scanner)
		api.POST("/rooms/:room_id/checkin-qr", handler.HandleQRCheckin(db, redisClient))

		// ── Organisation sync (webhook or admin trigger) ──────────────────────
		api.POST("/sync/organizations", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
			defer cancel()
			orgs, err := syncService.SyncOrganizations(ctx)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"message":       "Organizations successfully synchronized from Auth Service",
				"synced_count":  len(orgs),
				"organizations": orgs,
			})
		})

		// ── Admin-protected room management (ADMIN JWT required) ──────────────
		admin := api.Group("/admin", middleware.RequireAdminJWT())
		{
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
