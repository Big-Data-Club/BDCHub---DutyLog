package sync

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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

// SyncOrganizations fetches the source-of-truth organizations from auth-and-management-service
// and upserts them into the local replicated organizations table.
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
	}

	return orgs, nil
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
