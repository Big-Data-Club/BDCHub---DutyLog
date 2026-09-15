package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/model"
	dutySync "github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/sync"
)

// In memory mock room catalog and presence store for initial scaffold
var (
	roomsLock sync.RWMutex
	roomsList = []model.Room{
		{
			ID:               "CS1-605-C6",
			OrganizationID:   1,
			Campus:           "Campus 1",
			Building:         "C6",
			RoomNumber:       "605",
			Name:             "Big Data Club Room 605 C6",
			Capacity:         30,
			IsActive:         true,
			CurrentOccupancy: 0,
		},
		{
			ID:               "CS1-303-B9",
			OrganizationID:   1,
			Campus:           "Campus 1",
			Building:         "B9",
			RoomNumber:       "303",
			Name:             "AI & Analytics Room 303 B9",
			Capacity:         25,
			IsActive:         true,
			CurrentOccupancy: 0,
		},
		{
			ID:               "CS2-710-H6",
			OrganizationID:   1,
			Campus:           "Campus 2",
			Building:         "H6",
			RoomNumber:       "710",
			Name:             "Branch Room 710 H6",
			Capacity:         20,
			IsActive:         true,
			CurrentOccupancy: 0,
		},
	}

	presenceLock sync.RWMutex
	// room_id -> map[student_id]model.RoomOccupant
	activeOccupancy = make(map[string]map[string]model.RoomOccupant)
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

	// Initialize organization synchronization service with Auth Service
	syncService := dutySync.NewOrgSyncService(authURL, nil)

	// Run initial synchronization on startup
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		orgs, err := syncService.SyncOrganizations(ctx)
		if err != nil {
			log.Printf("[MAIN] Warning: Initial organization sync from %s failed (will retry): %v", authURL, err)
		} else {
			log.Printf("[MAIN] Initial organization sync succeeded: %d orgs loaded", len(orgs))
		}
	}()

	// Start periodic background sync every 5 minutes
	syncService.StartPeriodicSync(context.Background(), 5*time.Minute)

	r := gin.Default()

	// Health check
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "dutylog-service",
			"timestamp": time.Now().UTC(),
		})
	})

	api := r.Group("/api/v1")
	{
		// Organization rooms
		api.GET("/orgs/:org_id/rooms", handleGetOrgRooms)

		// Synchronous room operations
		api.POST("/rooms/:room_id/checkin", handleCheckIn)
		api.POST("/rooms/:room_id/checkout", handleCheckOut)
		api.GET("/rooms/:room_id/occupancy", handleGetOccupancy)

		// Organization synchronization endpoint (invoked by Auth Service webhook or admin)
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
	}

	log.Printf("Starting DutyLog Backend Service on port %s (Auth Service: %s)...", port, authURL)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}

func handleGetOrgRooms(c *gin.Context) {
	roomsLock.RLock()
	defer roomsLock.RUnlock()

	presenceLock.RLock()
	res := make([]model.Room, len(roomsList))
	for i, room := range roomsList {
		copyRoom := room
		if occ, exists := activeOccupancy[room.ID]; exists {
			copyRoom.CurrentOccupancy = len(occ)
		} else {
			copyRoom.CurrentOccupancy = 0
		}
		res[i] = copyRoom
	}
	presenceLock.RUnlock()

	c.JSON(http.StatusOK, gin.H{
		"organization_id": 1,
		"rooms":           res,
	})
}

func handleCheckIn(c *gin.Context) {
	roomID := c.Param("room_id")
	var req model.CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	presenceLock.Lock()
	if _, ok := activeOccupancy[roomID]; !ok {
		activeOccupancy[roomID] = make(map[string]model.RoomOccupant)
	}

	now := time.Now().UTC()
	occupant := model.RoomOccupant{
		StudentID:   req.StudentID,
		StudentName: "Student " + req.StudentID,
		CheckInAt:   now,
		IsOnDuty:    true,
	}
	activeOccupancy[roomID][req.StudentID] = occupant
	count := len(activeOccupancy[roomID])
	presenceLock.Unlock()

	// In production, publish Kafka event: dutylog.presence.v1
	log.Printf("[EVENT:dutylog.presence.v1] CHECK_IN student=%s room=%s time=%s", req.StudentID, roomID, now.Format(time.RFC3339))

	c.JSON(http.StatusOK, model.CheckInResponse{
		Success:              true,
		PresenceID:           time.Now().UnixNano(),
		RoomID:               roomID,
		StudentID:            req.StudentID,
		StudentName:          occupant.StudentName,
		CheckInAt:            now,
		IsOnDuty:             occupant.IsOnDuty,
		CurrentRoomOccupancy: count,
	})
}

func handleCheckOut(c *gin.Context) {
	roomID := c.Param("room_id")
	var req model.CheckOutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	presenceLock.Lock()
	var durationSec int64 = 0
	if occMap, ok := activeOccupancy[roomID]; ok {
		if prev, found := occMap[req.StudentID]; found {
			durationSec = int64(time.Since(prev.CheckInAt).Seconds())
			delete(occMap, req.StudentID)
		}
	}
	count := 0
	if occMap, ok := activeOccupancy[roomID]; ok {
		count = len(occMap)
	}
	presenceLock.Unlock()

	now := time.Now().UTC()
	log.Printf("[EVENT:dutylog.presence.v1] CHECK_OUT student=%s room=%s duration=%ds", req.StudentID, roomID, durationSec)

	c.JSON(http.StatusOK, model.CheckOutResponse{
		Success:              true,
		RoomID:               roomID,
		StudentID:            req.StudentID,
		CheckOutAt:           now,
		DurationSeconds:      durationSec,
		CurrentRoomOccupancy: count,
	})
}

func handleGetOccupancy(c *gin.Context) {
	roomID := c.Param("room_id")

	presenceLock.RLock()
	defer presenceLock.RUnlock()

	occupants := make([]model.RoomOccupant, 0)
	if occMap, ok := activeOccupancy[roomID]; ok {
		for _, occ := range occMap {
			occupants = append(occupants, occ)
		}
	}

	c.JSON(http.StatusOK, model.RoomOccupancyResponse{
		RoomID:         roomID,
		OccupancyCount: len(occupants),
		Occupants:      occupants,
	})
}
