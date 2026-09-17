# DutyLog API and Event Specification

Author: BDC Dev Team  
Version: 1.0.0  
Protocol: HTTP REST and Apache Kafka  

---

## 1. REST API Specification

Base Path: `/api/v1`  
Authentication: Bearer JWT Token issued by BDC Hub Auth Service.  

### Room Endpoints

#### 1. List Rooms for Organization
* Method: `GET`
* Path: `/orgs/{org_id}/rooms`
* Description: Retrieves all rooms registered under a specific organization.
* Response: `200 OK`
```json
{
  "organization_id": 1,
  "rooms": [
    {
      "id": "CS1-605-C6",
      "name": "Club Room 605 C6",
      "campus": "Campus 1",
      "building": "C6",
      "room_number": "605",
      "capacity": 30,
      "is_active": true,
      "current_occupancy": 8
    },
    {
      "id": "CS1-303-B9",
      "name": "Lab Room 303 B9",
      "campus": "Campus 1",
      "building": "B9",
      "room_number": "303",
      "capacity": 25,
      "is_active": true,
      "current_occupancy": 3
    },
    {
      "id": "CS2-710-H6",
      "name": "Branch Room 710 H6",
      "campus": "Campus 2",
      "building": "H6",
      "room_number": "710",
      "capacity": 20,
      "is_active": true,
      "current_occupancy": 0
    }
  ]
}
```

---

### Presence Endpoints (Synchronous Critical Path)

#### 2. Check In to Room
* Method: `POST`
* Path: `/rooms/{room_id}/checkin`
* Description: Records a student entering the specified room using barcode or manual input.
* Request Body:
```json
{
  "student_id": "2112345",
  "method": "BARCODE_SCAN",
  "client_timestamp": "2026-09-15T14:00:00Z"
}
```
* Response: `200 OK`
```json
{
  "success": true,
  "presence_id": 10452,
  "room_id": "CS1-605-C6",
  "student_id": "2112345",
  "student_name": "Nguyen Van A",
  "check_in_at": "2026-09-15T14:00:01Z",
  "is_on_duty": true,
  "current_room_occupancy": 9
}
```

#### 3. Check Out from Room
* Method: `POST`
* Path: `/rooms/{room_id}/checkout`
* Description: Records a student departing from the room and computes total session duration.
* Request Body:
```json
{
  "student_id": "2112345",
  "method": "BARCODE_SCAN",
  "client_timestamp": "2026-09-15T16:30:00Z"
}
```
* Response: `200 OK`
```json
{
  "success": true,
  "room_id": "CS1-605-C6",
  "student_id": "2112345",
  "check_out_at": "2026-09-15T16:30:01Z",
  "duration_seconds": 9000,
  "current_room_occupancy": 8
}
```

#### 4. Live Room Occupants
* Method: `GET`
* Path: `/rooms/{room_id}/occupancy`
* Description: Real time query returning active occupants directly from Redis cache.
* Response: `200 OK`
```json
{
  "room_id": "CS1-605-C6",
  "occupancy_count": 2,
  "occupants": [
    {
      "student_id": "2112345",
      "student_name": "Nguyen Van A",
      "check_in_at": "2026-09-15T14:00:01Z",
      "is_on_duty": true
    },
    {
      "student_id": "2112999",
      "student_name": "Tran Thi B",
      "check_in_at": "2026-09-15T15:10:20Z",
      "is_on_duty": false
    }
  ]
}
```

#### 5. Bulk Offline Synchronization
* Method: `POST`
* Path: `/rooms/{room_id}/sync-batch`
* Description: Ingests an array of cached scan events captured when the mobile device was offline.
* Request Body:
```json
{
  "room_id": "CS1-605-C6",
  "scans": [
    {
      "student_id": "2112001",
      "action": "CHECK_IN",
      "scan_timestamp": "2026-09-15T13:05:00Z"
    },
    {
      "student_id": "2112002",
      "action": "CHECK_IN",
      "scan_timestamp": "2026-09-15T13:12:00Z"
    }
  ]
}
```
* Response: `202 Accepted`
```json
{
  "status": "QUEUED",
  "accepted_records": 2,
  "job_id": "sync_batch_99214"
}
```

#### 6. Synchronize Organizations from Auth Service
* Method: `POST`
* Path: `/sync/organizations`
* Description: Triggers immediate pull synchronization of active organizations from BDC Hub Auth Service.
* Response: `200 OK`
```json
{
  "message": "Organizations successfully synchronized from Auth Service",
  "synced_count": 3,
  "organizations": [
    {
      "id": 1,
      "name": "Big Data Club",
      "slug": "bdc",
      "description": "Default organization",
      "is_active": true
    }
  ]
}
```

---

### User Organization Flow

#### 7. User Organizations (Smart Routing)
* Method: `GET`
* Path: `/user/organizations`
* Headers: `Authorization: Bearer <JWT>`
* Description: Returns organizations the authenticated user belongs to. Single-org users are automatically routed; multi-org users select manually; Super Admins receive all organizations.
* Response: `200 OK`
```json
{
  "user_id": 101,
  "email": "student@bdc.edu.vn",
  "is_super_admin": false,
  "count": 1,
  "organizations": [
    {
      "id": 1,
      "slug": "bdc",
      "name": "Big Data Club",
      "org_role": "MEMBER",
      "room_count": 3
    }
  ]
}
```

---

### Duty Shift Operations

#### 8. Start Duty Shift
* Method: `POST`
* Path: `/rooms/{room_id}/shift/start`
* Request Body: `{ "duty_staff_id": "101", "duty_staff_name": "Nguyen Van A", "duty_staff_email": "staff@bdc.edu.vn" }`
* Response: `200 OK` (Records active shift and start time)

#### 9. End Duty Shift
* Method: `POST`
* Path: `/rooms/{room_id}/shift/end`
* Request Body: `{ "duty_staff_id": "101" }`
* Response: `200 OK` (Calculates duration and sets status to COMPLETED)

#### 10. Get Current Shift
* Method: `GET`
* Path: `/rooms/{room_id}/shift/current`
* Response: `200 OK` (`{ "has_active_shift": true, "shift": { ... } }`)

---

### Super Admin Bottom-Up Inspection Endpoints

#### 11. Hierarchy Inspection
* Method: `GET`
* Path: `/admin/inspection/hierarchy`
* Headers: `Authorization: Bearer <ADMIN_JWT>`
* Description: Returns full `Org -> Rooms` tree with room statistics.

#### 12. Check-in/Check-out History
* Method: `GET`
* Path: `/admin/rooms/{room_id}/presence-history`
* Headers: `Authorization: Bearer <ADMIN_JWT>`
* Description: Detailed check-in/check-out logs with scanner identity (`scanner_id`, `scanner_name`) and membership validity (`is_valid_member`). Entries with `is_valid_member: false` are displayed in **RED**.

#### 13. Duty Shift History
* Method: `GET`
* Path: `/admin/rooms/{room_id}/duty-history`
* Headers: `Authorization: Bearer <ADMIN_JWT>`
* Description: Shift records with staff identity, shift start time, shift end time, and total duration.

---

## 2. Apache Kafka Event Contract

* Topic Name: `dutylog.presence.v1`
* Message Key: `room_id` (Ensures strict partition ordering per room)
* Serialization: JSON UTF 8

### Event Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DutyLogPresenceEvent",
  "type": "object",
  "properties": {
    "event_id": { "type": "string" },
    "event_version": { "type": "string", "enum": ["1.0"] },
    "event_type": { "type": "string", "enum": ["CHECK_IN", "CHECK_OUT"] },
    "organization_id": { "type": "integer" },
    "room_id": { "type": "string" },
    "student_id": { "type": "string" },
    "student_name": { "type": "string" },
    "duty_assigned": { "type": "boolean" },
    "timestamp": { "type": "string", "format": "date-time" },
    "duration_seconds": { "type": ["integer", "null"] }
  },
  "required": [
    "event_id",
    "event_version",
    "event_type",
    "organization_id",
    "room_id",
    "student_id",
    "timestamp"
  ]
}
```
