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
	Method          string    `json:"method"`
	ClientTimestamp time.Time `json:"client_timestamp"`
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
	StudentID   string    `json:"student_id"`
	StudentName string    `json:"student_name"`
	CheckInAt   time.Time `json:"check_in_at"`
	IsOnDuty    bool      `json:"is_on_duty"`
}

type RoomOccupancyResponse struct {
	RoomID         string         `json:"room_id"`
	OccupancyCount int            `json:"occupancy_count"`
	Occupants      []RoomOccupant `json:"occupants"`
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
}
