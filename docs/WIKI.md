# DutyLog Wiki

Document Owner: BDC Dev Team  
Ecosystem: BDC Hub Core Application  
Status: Active  

---

## 1. Executive Summary

DutyLog is the automated club room access and duty attendance verification system for Big Data Club. The system operates across three distinct rooms situated on two distant campuses:

* Campus 1: Room 605 C6
* Campus 1: Room 303 B9
* Campus 2: Room 710 H6

The platform replaces paper logs and manual messaging by providing an automated verification workflow through a dedicated mobile application. Physical attendance is confirmed by scanning student identity cards using the camera of a mobile device.

---

## 2. Stakeholders and User Roles

### Club Leadership and Room Managers
Club leadership requires accurate visibility into room occupancy and duty adherence across all three locations simultaneously. Key responsibilities include:
* Monitoring active attendance and current occupants in real time.
* Receiving automated alerts when scheduled duty personnel fail to check in.
* Exporting historical attendance records for university credit and activity reports.

### Duty Personnel (Scheduled Members)
Members assigned to specific time slots in the duty schedule:
* Must check in promptly upon arrival at the assigned room.
* Remain recorded as the active duty personnel until checking out or handing over the room.
* Receive timely mobile reminders prior to shift start times.

### General Club Members and Visitors
Club members accessing the room for self study, project collaboration, or club meetings:
* Present their student identity card to scan upon entering the room.
* Scan again upon departure to ensure accurate room capacity metrics.

---

## 3. End to End User Workflows

```mermaid
sequenceDiagram
    autonumber
    actor Member as Club Member
    participant App as Mobile App (React Native)
    participant API as DutyLog Backend Service
    participant Redis as Redis Cache
    participant DB as PostgreSQL Database
    participant Kafka as Apache Kafka Topic

    Member->>App: Open app and choose Room (for example 605 C6)
    Member->>App: Scan Student Card Barcode
    App->>API: POST /api/v1/rooms/{id}/checkin {student_id, method}
    API->>DB: Record attendance entry in presence log
    API->>Redis: Add student to active room occupants set
    API-->>App: Return 200 OK with student name and entry time
    App-->>Member: Emit audio confirmation and haptic feedback
    API-)Kafka: Publish event to dutylog.presence.v1
```

### Shift Handover and Check Out Flow
1. The departing member selects the active room on the mobile application.
2. The member scans their student identity card or taps the check out button.
3. The system updates the presence log with the departure timestamp, computes total duration, and removes the student from the active occupants set in Redis.
4. An exit event is dispatched to Apache Kafka to update management dashboards and analytical storage.

---

## 4. Multi Organization Room Management

DutyLog is architected to accommodate multiple independent student organizations, clubs, and academic laboratories within the university.

* Organization Scoping: Every room is registered under an owning organization identifier (`org_id`).
* Data Isolation: Duty schedules, member rosters, and presence logs are partitioned by organization.
* Shared Campus Infrastructure: Organizations can share campus facility metadata while retaining strict control over room permissions and schedule policies.
* Authentication Integration: Leverages BDC Hub identity tokens for role validation, ensuring that only authorized administrators can alter room configurations or duty rotas.

---

## 5. Development and Operational Guide

### Prerequisites
* Go version 1.22 or higher
* Node.js version 20 or higher
* Docker and Docker Compose
* PostgreSQL database instance
* Redis instance
* Apache Kafka broker instance

### Local Environment Configuration
Create a `.env` file in the `backend/` directory:

```env
PORT=8086
ENVIRONMENT=development
DATABASE_URL=postgres://bdc_user:bdc_password@localhost:5432/bdc_hub?sslmode=disable
REDIS_URL=redis://localhost:6379/0
KAFKA_BROKERS=localhost:9092
KAFKA_PRESENCE_TOPIC=dutylog.presence.v1
JWT_SECRET=your_development_jwt_secret
```

### Starting the Services

1. Launch backing services through Docker Compose:
```bash
docker compose up -d postgres redis kafka
```

2. Start the DutyLog backend service:
```bash
cd backend
go run cmd/server/main.go
```

3. Launch the mobile application in development mode:
```bash
cd mobile
npm install
npx expo start
```
