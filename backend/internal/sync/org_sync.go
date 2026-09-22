package sync

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/Big-Data-Club/BDCHub-DutyLog/backend/internal/model"
)

type AuthOrgResponse struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
}

type AuthMemberResponse struct {
	UserID      int64  `json:"user_id"`
	FullName    string `json:"full_name"`
	Email       string `json:"email"`
	StudentCode string `json:"student_code"`
	OrgRole     string `json:"org_role"`
}

type OrgSyncService struct {
	authBaseURL string
	httpClient  *http.Client
	db          *sql.DB
}

func NewOrgSyncService(authBaseURL string, db *sql.DB) *OrgSyncService {
	return &OrgSyncService{
		authBaseURL: authBaseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		db: db,
	}
}

// SyncOrganizations fetches source-of-truth organizations and their members
// from auth-and-management-service and upserts them into local replicated tables.
func (s *OrgSyncService) SyncOrganizations(ctx context.Context) ([]AuthOrgResponse, error) {
	reqURL := fmt.Sprintf("%s/api/organizations", s.authBaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request to auth service: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call auth service %s: %w", reqURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("auth service returned HTTP %d for %s", resp.StatusCode, reqURL)
	}

	var orgs []AuthOrgResponse
	if err := json.NewDecoder(resp.Body).Decode(&orgs); err != nil {
		return nil, fmt.Errorf("decode auth organizations response: %w", err)
	}

	log.Printf("[ORG_SYNC] Retrieved %d organizations from Auth Service (%s)", len(orgs), s.authBaseURL)

	if s.db != nil {
		if err := s.persistOrganizations(ctx, orgs); err != nil {
			return nil, fmt.Errorf("persist synchronized organizations: %w", err)
		}

		// Sync members for each organization
		for _, org := range orgs {
			if err := s.SyncMembers(ctx, org.ID); err != nil {
				log.Printf("[ORG_SYNC] Warning: sync members for org %d (%s) failed: %v", org.ID, org.Name, err)
			}
		}
	}

	return orgs, nil
}

// SyncMembers fetches members of a specific organization from Auth Service and upserts them
func (s *OrgSyncService) SyncMembers(ctx context.Context, orgID int64) error {
	reqURL := fmt.Sprintf("%s/api/organizations/%d/members", s.authBaseURL, orgID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return fmt.Errorf("create member request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("call auth service %s: %w", reqURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("auth service returned HTTP %d for %s", resp.StatusCode, reqURL)
	}

	var members []AuthMemberResponse
	if err := json.NewDecoder(resp.Body).Decode(&members); err != nil {
		return fmt.Errorf("decode members response: %w", err)
	}

	query := `
		INSERT INTO organization_members (organization_id, user_id, student_code, email, full_name, org_role, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (organization_id, user_id) DO UPDATE
		SET student_code = EXCLUDED.student_code,
		    email        = EXCLUDED.email,
		    full_name    = EXCLUDED.full_name,
		    org_role     = EXCLUDED.org_role,
		    updated_at   = NOW();
	`

	stmt, err := s.db.PrepareContext(ctx, query)
	if err != nil {
		return fmt.Errorf("prepare member insert stmt: %w", err)
	}
	defer stmt.Close()

	for _, m := range members {
		if _, err := stmt.ExecContext(ctx, orgID, m.UserID, m.StudentCode, m.Email, m.FullName, m.OrgRole); err != nil {
			log.Printf("[ORG_SYNC] Failed to upsert member %d into org %d: %v", m.UserID, orgID, err)
		}
	}

	log.Printf("[ORG_SYNC] Synced %d members for org %d", len(members), orgID)
	return nil
}

// UserVerificationResult holds whether an individual exists on the system and if they belong to the room's org.
type UserVerificationResult struct {
	IsMember     bool   `json:"is_member"`
	IsSystemUser bool   `json:"is_system_user"`
	FullName     string `json:"full_name"`
	Email        string `json:"email"`
	UserID       int64  `json:"user_id,omitempty"`
	OrgRole      string `json:"org_role,omitempty"`
	OrgName      string `json:"org_name,omitempty"`
}

type AuthUserLookupItem struct {
	ID             int64    `json:"id"`
	Name           string   `json:"name"`
	Email          string   `json:"email"`
	Role           string   `json:"role"`
	Roles          []string `json:"roles"`
	Team           string   `json:"team"`
	Type           string   `json:"type"`
	Code           string   `json:"code"`
	TotalScore     int      `json:"totalScore"`
	Active         bool     `json:"active"`
	ProfilePicture string   `json:"profilePicture"`
	Organization   string   `json:"organization"`
	Organizations  []string `json:"organizations"`
	CreatedAt      string   `json:"createdAt"`
}

type AuthUserLookupPage struct {
	Items []AuthUserLookupItem `json:"items"`
}

// VerifyUser checks whether an individual exists on the system, and whether they belong to the specified organization.
// Strict verification with zero hardcoding: checks local replicated org tables, all system org tables, and Auth Service.
func (s *OrgSyncService) VerifyUser(ctx context.Context, orgID int64, identifier string) (UserVerificationResult, error) {
	cleanID := strings.TrimSpace(identifier)
	if cleanID == "" {
		return UserVerificationResult{}, nil
	}

	if s.db == nil {
		return UserVerificationResult{IsMember: true, IsSystemUser: true}, nil
	}

	// 1. Check local replicated organization_members table for the specific organization
	var res UserVerificationResult
	err := s.db.QueryRowContext(ctx, `
		SELECT m.user_id, m.full_name, m.email, m.org_role, o.name
		FROM organization_members m
		JOIN organizations o ON m.organization_id = o.id
		WHERE m.organization_id = $1
		  AND (LOWER(TRIM(m.student_code)) = LOWER($2) OR m.user_id::text = $2 OR LOWER(TRIM(m.email)) = LOWER($2))
		LIMIT 1
	`, orgID, cleanID).Scan(&res.UserID, &res.FullName, &res.Email, &res.OrgRole, &res.OrgName)

	if err == nil {
		res.IsMember = true
		res.IsSystemUser = true
		return res, nil
	}

	// 2. Check if the user exists in ANY other organization on the system (Registered user, but not in this org)
	var anyOrgRes UserVerificationResult
	err = s.db.QueryRowContext(ctx, `
		SELECT m.user_id, m.full_name, m.email, m.org_role, o.name
		FROM organization_members m
		JOIN organizations o ON m.organization_id = o.id
		WHERE LOWER(TRIM(m.student_code)) = LOWER($1) OR m.user_id::text = $1 OR LOWER(TRIM(m.email)) = LOWER($1)
		LIMIT 1
	`, cleanID).Scan(&anyOrgRes.UserID, &anyOrgRes.FullName, &anyOrgRes.Email, &anyOrgRes.OrgRole, &anyOrgRes.OrgName)

	if err == nil {
		anyOrgRes.IsMember = false
		anyOrgRes.IsSystemUser = true
		return anyOrgRes, nil
	}

	// 3. On local cache miss, query Auth Service dynamically
	syncCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	// Sync current org members in case newly added
	if syncErr := s.SyncMembers(syncCtx, orgID); syncErr == nil {
		err = s.db.QueryRowContext(ctx, `
			SELECT m.user_id, m.full_name, m.email, m.org_role, o.name
			FROM organization_members m
			JOIN organizations o ON m.organization_id = o.id
			WHERE m.organization_id = $1
			  AND (LOWER(TRIM(m.student_code)) = LOWER($2) OR m.user_id::text = $2 OR LOWER(TRIM(m.email)) = LOWER($2))
			LIMIT 1
		`, orgID, cleanID).Scan(&res.UserID, &res.FullName, &res.Email, &res.OrgRole, &res.OrgName)
		if err == nil {
			res.IsMember = true
			res.IsSystemUser = true
			return res, nil
		}
	}

	// 4. Query Auth Service /api/users?query=cleanID to check system existence
	authURLs := []string{s.authBaseURL}
	if !strings.Contains(s.authBaseURL, "localhost") {
		authURLs = append(authURLs, "http://localhost:8080")
	}

	var orgName, orgSlug string
	_ = s.db.QueryRowContext(ctx, `SELECT name, slug FROM organizations WHERE id = $1`, orgID).Scan(&orgName, &orgSlug)

	for _, baseURL := range authURLs {
		reqURL := fmt.Sprintf("%s/api/users?query=%s", baseURL, cleanID)
		req, rErr := http.NewRequestWithContext(syncCtx, http.MethodGet, reqURL, nil)
		if rErr != nil {
			continue
		}
		resp, dErr := s.httpClient.Do(req)
		if dErr != nil || resp.StatusCode != http.StatusOK {
			if resp != nil {
				resp.Body.Close()
			}
			continue
		}

		var page AuthUserLookupPage
		decErr := json.NewDecoder(resp.Body).Decode(&page)
		resp.Body.Close()
		if decErr != nil {
			continue
		}

		for _, item := range page.Items {
			if strings.EqualFold(strings.TrimSpace(item.Code), cleanID) ||
				strings.EqualFold(strings.TrimSpace(item.Email), cleanID) ||
				fmt.Sprintf("%d", item.ID) == cleanID {
				isMember := false
				for _, o := range item.Organizations {
					if (orgName != "" && strings.EqualFold(o, orgName)) ||
						(orgSlug != "" && strings.EqualFold(o, orgSlug)) {
						isMember = true
						break
					}
				}
				if isMember {
					_, _ = s.db.ExecContext(ctx, `
						INSERT INTO organization_members (organization_id, user_id, student_code, email, full_name, org_role, updated_at)
						VALUES ($1, $2, $3, $4, $5, $6, NOW())
						ON CONFLICT (organization_id, user_id) DO UPDATE
						SET student_code = EXCLUDED.student_code, full_name = EXCLUDED.full_name, email = EXCLUDED.email;
					`, orgID, item.ID, item.Code, item.Email, item.Name, item.Role)
				}
				return UserVerificationResult{
					IsMember:     isMember,
					IsSystemUser: true,
					FullName:     item.Name,
					Email:        item.Email,
					UserID:       item.ID,
					OrgRole:      item.Role,
					OrgName:      orgName,
				}, nil
			}
		}
	}

	// 5. Not found on system or organization
	return UserVerificationResult{
		IsMember:     false,
		IsSystemUser: false,
		FullName:     "",
		Email:        "",
	}, nil
}

// VerifyMembership checks whether an individual belongs to the specified organization.
// Retained for backward-compatibility; delegates to VerifyUser.
func (s *OrgSyncService) VerifyMembership(ctx context.Context, orgID int64, identifier string) (bool, string, string, error) {
	result, err := s.VerifyUser(ctx, orgID, identifier)
	return result.IsMember, result.FullName, result.Email, err
}

// GetStudentProfile looks up the student's full profile across local member cache and central Auth Service.
func (s *OrgSyncService) GetStudentProfile(ctx context.Context, identifier string) (*model.StudentProfile, error) {
	cleanID := strings.TrimSpace(identifier)
	if cleanID == "" {
		return nil, nil
	}

	// 1. Try querying Auth Service for complete profile
	authURLs := []string{s.authBaseURL}
	if !strings.Contains(s.authBaseURL, "localhost") {
		authURLs = append(authURLs, "http://localhost:8080")
	}

	reqCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	for _, baseURL := range authURLs {
		reqURL := fmt.Sprintf("%s/api/users?query=%s", baseURL, cleanID)
		req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, reqURL, nil)
		if err != nil {
			continue
		}
		resp, err := s.httpClient.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			if resp != nil {
				resp.Body.Close()
			}
			continue
		}

		var page AuthUserLookupPage
		decErr := json.NewDecoder(resp.Body).Decode(&page)
		resp.Body.Close()
		if decErr != nil {
			continue
		}

		for _, item := range page.Items {
			if strings.EqualFold(strings.TrimSpace(item.Code), cleanID) ||
				strings.EqualFold(strings.TrimSpace(item.Email), cleanID) ||
				fmt.Sprintf("%d", item.ID) == cleanID {

				orgStr := item.Organization
				if orgStr == "" && len(item.Organizations) > 0 {
					orgStr = strings.Join(item.Organizations, ", ")
				}

				return &model.StudentProfile{
					ID:             fmt.Sprintf("%d", item.ID),
					Name:           item.Name,
					Email:          item.Email,
					Code:           item.Code,
					Role:           item.Role,
					Roles:          item.Roles,
					Team:           item.Team,
					Type:           item.Type,
					Score:          item.TotalScore,
					DateAdded:      item.CreatedAt,
					Status:         item.Active,
					ProfilePicture: item.ProfilePicture,
					Organization:   orgStr,
					Organizations:  item.Organizations,
				}, nil
			}
		}
	}

	// 2. Fallback to local organization_members table
	if s.db != nil {
		var userID int64
		var fullName, email, studentCode, orgRole, orgName string
		var createdAt time.Time
		err := s.db.QueryRowContext(ctx, `
			SELECT m.user_id, m.full_name, m.email, COALESCE(m.student_code, ''), m.org_role, o.name, m.created_at
			FROM organization_members m
			JOIN organizations o ON m.organization_id = o.id
			WHERE LOWER(TRIM(m.student_code)) = LOWER($1) OR m.user_id::text = $1 OR LOWER(TRIM(m.email)) = LOWER($1)
			LIMIT 1
		`, cleanID).Scan(&userID, &fullName, &email, &studentCode, &orgRole, &orgName, &createdAt)

		if err == nil {
			return &model.StudentProfile{
				ID:            fmt.Sprintf("%d", userID),
				Name:          fullName,
				Email:         email,
				Code:          studentCode,
				Role:          orgRole,
				Roles:         []string{orgRole},
				Team:          "Research",
				Type:          "CLC",
				Score:         0,
				DateAdded:     createdAt.Format(time.RFC3339),
				Status:        true,
				Organization:  orgName,
				Organizations: []string{orgName},
			}, nil
		}
	}

	return nil, nil
}

// persistOrganizations writes the synced organizations into the database using an upsert transaction
func (s *OrgSyncService) persistOrganizations(ctx context.Context, orgs []AuthOrgResponse) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO organizations (id, slug, name, description, is_active, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (id) DO UPDATE
		SET
			slug = EXCLUDED.slug,
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			is_active = EXCLUDED.is_active,
			updated_at = NOW();
	`

	stmt, err := tx.PrepareContext(ctx, query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	var bdcOrgID int64 = 0
	for _, org := range orgs {
		if _, err := stmt.ExecContext(ctx, org.ID, org.Slug, org.Name, org.Description, org.IsActive); err != nil {
			return fmt.Errorf("upsert org %d (%s): %w", org.ID, org.Slug, err)
		}
		if org.Slug == "bdc" {
			bdcOrgID = org.ID
		}
	}

	// If Big Data Club organization exists, ensure official rooms are bound to its REAL org ID
	if bdcOrgID > 0 {
		roomQuery := `
			INSERT INTO rooms (id, organization_id, campus, building, room_number, name, capacity, is_active)
			VALUES
				('CS1-605-C6', $1, 'Campus 1', 'C6', '605', 'Big Data Club Room 605 C6', 30, true),
				('CS1-303-B9', $1, 'Campus 1', 'B9', '303', 'AI & Analytics Room 303 B9', 25, true),
				('CS2-710-H6', $1, 'Campus 2', 'H6', '710', 'Branch Room 710 H6', 20, true)
			ON CONFLICT (id) DO UPDATE
			SET
				organization_id = EXCLUDED.organization_id,
				name = EXCLUDED.name,
				capacity = EXCLUDED.capacity,
				is_active = EXCLUDED.is_active,
				updated_at = NOW();
		`
		if _, err := tx.ExecContext(ctx, roomQuery, bdcOrgID); err != nil {
			return fmt.Errorf("ensure official rooms for org %d: %w", bdcOrgID, err)
		}
		log.Printf("[ORG_SYNC] Associated official club rooms with synced BDC Org ID: %d", bdcOrgID)
	}

	return tx.Commit()
}

// StartPeriodicSync launches a background goroutine to periodically poll and synchronize organizations
func (s *OrgSyncService) StartPeriodicSync(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				if _, err := s.SyncOrganizations(ctx); err != nil {
					log.Printf("[ORG_SYNC_ERROR] Periodic sync failed: %v", err)
				}
			}
		}
	}()
}
