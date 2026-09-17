package handler

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/model"
)

// HandleGetOrgRooms returns all active rooms for an org with live Redis occupancy.
// GET /api/v1/orgs/:org_id/rooms
// GET /api/v1/admin/orgs/:org_id/rooms  (same handler, admin group)
func HandleGetOrgRooms(db *sql.DB, rds *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgID := c.Param("org_id")
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := db.QueryContext(ctx, `
			SELECT id, organization_id, campus, building, room_number, name, capacity, is_active
			FROM rooms
			WHERE organization_id = $1 AND is_active = true
			ORDER BY campus, room_number
		`, orgID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var rooms []model.Room
		for rows.Next() {
			var r model.Room
			if err := rows.Scan(
				&r.ID, &r.OrganizationID, &r.Campus,
				&r.Building, &r.RoomNumber, &r.Name, &r.Capacity, &r.IsActive,
			); err != nil {
				continue
			}
			count, _ := rds.ZCard(ctx, "dutylog:room:"+r.ID+":active").Result()
			r.CurrentOccupancy = int(count)
			rooms = append(rooms, r)
		}
		if rooms == nil {
			rooms = []model.Room{}
		}

		c.JSON(http.StatusOK, gin.H{
			"organization_id": orgID,
			"rooms":           rooms,
		})
	}
}

// CreateRoomRequest is the body for creating a new physical room.
type CreateRoomRequest struct {
	ID         string `json:"id" binding:"required"`
	Campus     string `json:"campus" binding:"required"`
	Building   string `json:"building" binding:"required"`
	RoomNumber string `json:"room_number" binding:"required"`
	Name       string `json:"name" binding:"required"`
	Capacity   int    `json:"capacity"`
}

// UpdateRoomRequest allows partial updates to room metadata.
type UpdateRoomRequest struct {
	Name     string `json:"name"`
	Capacity int    `json:"capacity"`
	IsActive *bool  `json:"is_active"`
}

// HandleAdminCreateRoom creates a new physical room for an organisation.
// POST /api/v1/admin/orgs/:org_id/rooms  (ADMIN JWT required)
func HandleAdminCreateRoom(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgID := c.Param("org_id")
		var req CreateRoomRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.Capacity <= 0 {
			req.Capacity = 30
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, err := db.ExecContext(ctx, `
			INSERT INTO rooms (id, organization_id, campus, building, room_number, name, capacity, is_active)
			VALUES ($1, $2, $3, $4, $5, $6, $7, true)
		`, req.ID, orgID, req.Campus, req.Building, req.RoomNumber, req.Name, req.Capacity)
		if err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "room id already exists or constraint violation: " + err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": req.ID, "message": "room created"})
	}
}

// HandleAdminUpdateRoom updates name, capacity, and active state.
// PUT /api/v1/admin/rooms/:room_id  (ADMIN JWT required)
func HandleAdminUpdateRoom(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		var req UpdateRoomRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		isActive := true
		if req.IsActive != nil {
			isActive = *req.IsActive
		}
		_, err := db.ExecContext(ctx, `
			UPDATE rooms
			SET name       = CASE WHEN $1 <> '' THEN $1 ELSE name END,
			    capacity   = CASE WHEN $2 > 0 THEN $2 ELSE capacity END,
			    is_active  = $3,
			    updated_at = NOW()
			WHERE id = $4
		`, req.Name, req.Capacity, isActive, roomID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"id": roomID, "message": "room updated"})
	}
}

// HandleAdminDeleteRoom soft-deletes a room (sets is_active = false).
// DELETE /api/v1/admin/rooms/:room_id  (ADMIN JWT required)
func HandleAdminDeleteRoom(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomID := c.Param("room_id")
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, err := db.ExecContext(ctx,
			`UPDATE rooms SET is_active = false, updated_at = NOW() WHERE id = $1`,
			roomID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"id": roomID, "message": "room deactivated"})
	}
}

// HandleGetOrganizations returns all active organizations and their active room counts.
// GET /api/v1/organizations
func HandleGetOrganizations(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := db.QueryContext(ctx, `
			SELECT o.id, o.slug, o.name, COALESCE(o.description, ''), o.is_active, COUNT(r.id) AS room_count
			FROM organizations o
			LEFT JOIN rooms r ON r.organization_id = o.id AND r.is_active = true
			WHERE o.is_active = true
			GROUP BY o.id, o.slug, o.name, o.description, o.is_active
			ORDER BY o.id ASC
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		type OrgItem struct {
			ID          int64  `json:"id"`
			Slug        string `json:"slug"`
			Name        string `json:"name"`
			Description string `json:"description"`
			IsActive    bool   `json:"is_active"`
			RoomCount   int    `json:"room_count"`
		}

		var orgs []OrgItem
		for rows.Next() {
			var o OrgItem
			if err := rows.Scan(&o.ID, &o.Slug, &o.Name, &o.Description, &o.IsActive, &o.RoomCount); err != nil {
				continue
			}
			orgs = append(orgs, o)
		}
		if orgs == nil {
			orgs = []OrgItem{}
		}

		c.JSON(http.StatusOK, gin.H{
			"organizations": orgs,
		})
	}
}

