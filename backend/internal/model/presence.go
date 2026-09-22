package model

import "time"

type Room struct {
	ID               string `json:"id"`
	OrganizationID   uint   `json:"organization_id"`
	Campus           string `json:"campus"`
	Building         string `json:"building"`
	RoomNumber       string `json:"room_number"`
	Name             string `json:"name"`
	Capacity         int    `json:"capacity"`
	IsActive         bool   `json:"is_active"`
	CurrentOccupancy int    `json:"current_occupancy"`
}

type CheckInRequest struct {
	StudentID       string    `json:"student_id" binding:"required"`
	StudentName     string    `json:"student_name"`
	Method          string    `json:"method"`
	ClientTimestamp time.Time `json:"client_timestamp"`
	ScannerID       string    `json:"scanner_id"`
	ScannerName     string    `json:"scanner_name"`
}

type CheckOutRequest struct {
	StudentID       string    `json:"student_id" binding:"required"`
	Method          string    `json:"method"`
	ClientTimestamp time.Time `json:"client_timestamp"`
}

type CheckInResponse struct {
	Success              bool      `json:"success"`
	PresenceID           int64     `json:"presence_id"`
	RoomID               string    `json:"room_id"`
	StudentID            string    `json:"student_id"`
	StudentName          string    `json:"student_name"`
	CheckInAt            time.Time `json:"check_in_at"`
	IsOnDuty             bool      `json:"is_on_duty"`
	CurrentRoomOccupancy int       `json:"current_room_occupancy"`
	IsValidMember        bool      `json:"is_valid_member"`
	IsSystemUser         bool      `json:"is_system_user"`
	AlertColor           string    `json:"alert_color"` // "GREEN" or "RED"
	AlertMessage         string    `json:"alert_message"`
	ScannerID            string    `json:"scanner_id,omitempty"`
	ScannerName          string    `json:"scanner_name,omitempty"`
}

type CheckOutResponse struct {
	Success              bool      `json:"success"`
	RoomID               string    `json:"room_id"`
	StudentID            string    `json:"student_id"`
	CheckOutAt           time.Time `json:"check_out_at"`
	DurationSeconds      int64     `json:"duration_seconds"`
	CurrentRoomOccupancy int       `json:"current_room_occupancy"`
}

type RoomOccupant struct {
	StudentID     string    `json:"student_id"`
	StudentName   string    `json:"student_name"`
	CheckInAt     time.Time `json:"check_in_at"`
	IsOnDuty      bool      `json:"is_on_duty"`
	IsValidMember bool      `json:"is_valid_member"`
	IsSystemUser  bool      `json:"is_system_user"`
}

type RoomOccupancyResponse struct {
	RoomID         string         `json:"room_id"`
	OccupancyCount int            `json:"occupancy_count"`
	Occupants      []RoomOccupant `json:"occupants"`
}

type DutyShiftRecord struct {
	ID              int64      `json:"id"`
	OrganizationID  int64      `json:"organization_id"`
	RoomID          string     `json:"room_id"`
	DutyStaffID     string     `json:"duty_staff_id"`
	DutyStaffName   string     `json:"duty_staff_name"`
	DutyStaffEmail  string     `json:"duty_staff_email"`
	StartTime       time.Time  `json:"start_time"`
	EndTime         *time.Time `json:"end_time"`
	Status          string     `json:"status"` // 'ACTIVE', 'COMPLETED'
	DurationSeconds int64      `json:"duration_seconds"`
	CreatedAt       time.Time  `json:"created_at"`
}

type StartShiftRequest struct {
	DutyStaffID    string `json:"duty_staff_id"`
	DutyStaffName  string `json:"duty_staff_name"`
	DutyStaffEmail string `json:"duty_staff_email"`
}

type EndShiftRequest struct {
	DutyStaffID string `json:"duty_staff_id"`
}

type PresenceHistoryItem struct {
	ID              int64      `json:"id"`
	OrganizationID  int64      `json:"organization_id"`
	RoomID          string     `json:"room_id"`
	StudentID       string     `json:"student_id"`
	StudentName     string     `json:"student_name"`
	CheckInAt       time.Time  `json:"check_in_at"`
	CheckOutAt      *time.Time `json:"check_out_at"`
	DurationSeconds *int64     `json:"duration_seconds"`
	ScanMethod      string     `json:"scan_method"`
	IsOnDuty        bool       `json:"is_on_duty"`
	ScannerID       string     `json:"scanner_id"`
	ScannerName     string     `json:"scanner_name"`
	IsValidMember   bool       `json:"is_valid_member"`
	IsSystemUser    bool       `json:"is_system_user"`
	CreatedAt       time.Time  `json:"created_at"`
}

type InspectionOrgItem struct {
	ID          int64   `json:"id"`
	Slug        string  `json:"slug"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	IsActive    bool    `json:"is_active"`
	Rooms       []Room  `json:"rooms"`
}

type KafkaPresenceEvent struct {
	EventID         string     `json:"event_id"`
	EventVersion    string     `json:"event_version"`
	EventType       string     `json:"event_type"` // CHECK_IN, CHECK_OUT
	OrganizationID  uint       `json:"organization_id"`
	RoomID          string     `json:"room_id"`
	StudentID       string     `json:"student_id"`
	StudentName     string     `json:"student_name"`
	DutyAssigned    bool       `json:"duty_assigned"`
	Timestamp       time.Time  `json:"timestamp"`
	DurationSeconds *int64     `json:"duration_seconds,omitempty"`
	ScannerID       string     `json:"scanner_id,omitempty"`
	ScannerName     string     `json:"scanner_name,omitempty"`
	IsValidMember   bool       `json:"is_valid_member"`
	IsSystemUser    bool       `json:"is_system_user"`
}

type StudentProfile struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Email          string   `json:"email"`
	Code           string   `json:"code"`
	Role           string   `json:"role"`
	Roles          []string `json:"roles,omitempty"`
	Team           string   `json:"team"`
	Type           string   `json:"type"`
	Score          int      `json:"score"`
	DateAdded      string   `json:"date_added,omitempty"`
	Status         bool     `json:"status"`
	ProfilePicture string   `json:"profile_picture,omitempty"`
	Organization   string   `json:"organization,omitempty"`
	Organizations  []string `json:"organizations,omitempty"`
}
