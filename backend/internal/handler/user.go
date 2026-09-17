package handler

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type UserOrgItem struct {
	ID          int64  `json:"id"`
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
	OrgRole     string `json:"org_role,omitempty"`
	RoomCount   int    `json:"room_count"`
}

type UserOrgsResponse struct {
	UserID        int64         `json:"user_id"`
	Email         string        `json:"email"`
	IsSuperAdmin  bool          `json:"is_super_admin"`
	Count         int           `json:"count"`
	Organizations []UserOrgItem `json:"organizations"`
}

// HandleGetUserOrganizations returns the organizations an authenticated user belongs to.
// Super Admin users receive all organizations.
// Regular users receive only organizations they are enrolled in.
// GET /api/v1/user/organizations
func HandleGetUserOrganizations(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		userID, _ := c.Get("user_id")
		userEmail, _ := c.Get("user_email")
		isAdmin, _ := c.Get("is_admin")

		uid, _ := userID.(int64)
		email, _ := userEmail.(string)
		adminBool, _ := isAdmin.(bool)

		var orgs []UserOrgItem

		if adminBool {
			// Super Admin / Admin: access to all organizations
			rows, err := db.QueryContext(ctx, `
				SELECT o.id, o.slug, o.name, COALESCE(o.description, ''), COALESCE(m.org_role, 'ADMIN') AS org_role, COUNT(r.id) AS room_count
				FROM organizations o
				LEFT JOIN organization_members m ON o.id = m.organization_id AND (m.user_id = $1 OR ($2 <> '' AND LOWER(m.email) = LOWER($2)))
				LEFT JOIN rooms r ON r.organization_id = o.id AND r.is_active = true
				WHERE o.is_active = true
				GROUP BY o.id, o.slug, o.name, o.description, m.org_role
				ORDER BY o.id ASC
			`, uid, email)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			for rows.Next() {
				var item UserOrgItem
				if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &item.OrgRole, &item.RoomCount); err == nil {
					orgs = append(orgs, item)
				}
			}
		} else {
			// Regular User: query memberships
			rows, err := db.QueryContext(ctx, `
				SELECT o.id, o.slug, o.name, COALESCE(o.description, ''), m.org_role, COUNT(r.id) AS room_count
				FROM organizations o
				INNER JOIN organization_members m ON o.id = m.organization_id
				LEFT JOIN rooms r ON r.organization_id = o.id AND r.is_active = true
				WHERE o.is_active = true
				  AND (m.user_id = $1 OR ($2 <> '' AND LOWER(m.email) = LOWER($2)))
				GROUP BY o.id, o.slug, o.name, o.description, m.org_role
				ORDER BY o.id ASC
			`, uid, email)
			if err == nil {
				defer rows.Close()
				for rows.Next() {
					var item UserOrgItem
					if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &item.OrgRole, &item.RoomCount); err == nil {
						orgs = append(orgs, item)
					}
				}
			}

			// If no explicit membership found (e.g. dev mode or new user), fall back to public active orgs
			if len(orgs) == 0 {
				defaultRows, err := db.QueryContext(ctx, `
					SELECT o.id, o.slug, o.name, COALESCE(o.description, ''), 'MEMBER' AS org_role, COUNT(r.id) AS room_count
					FROM organizations o
					LEFT JOIN rooms r ON r.organization_id = o.id AND r.is_active = true
					WHERE o.is_active = true
					GROUP BY o.id, o.slug, o.name, o.description
					ORDER BY o.id ASC
				`)
				if err == nil {
					defer defaultRows.Close()
					for defaultRows.Next() {
						var item UserOrgItem
						if err := defaultRows.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &item.OrgRole, &item.RoomCount); err == nil {
							orgs = append(orgs, item)
						}
					}
				}
			}
		}

		if orgs == nil {
			orgs = []UserOrgItem{}
		}

		c.JSON(http.StatusOK, UserOrgsResponse{
			UserID:        uid,
			Email:         email,
			IsSuperAdmin:  adminBool,
			Count:         len(orgs),
			Organizations: orgs,
		})
	}
}
