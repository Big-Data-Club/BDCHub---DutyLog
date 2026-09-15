# BDC Hub DutyLog (CLBCheckin)

DutyLog is a club room presence and duty schedule management platform developed by the BDC Dev Team. It automates student check in and check out verification using barcode scanning on mobile devices, manages duty shifts across multiple campuses, and delivers real time occupancy visibility for club leadership.

---

## 1. Project Overview

The Big Data Club oversees three designated rooms located across two campuses:
* Campus 1: Room 605 C6 and Room 303 B9
* Campus 2: Room 710 H6

Historically, attendance and duty logging relied on manual paper logs, spreadsheets, and informal chat notifications. This created discrepancies, lacked verification of physical presence, and introduced delays in attendance tracking.

DutyLog replaces manual tracking with an automated, camera driven barcode scanning flow on mobile devices. The solution provides instant verification upon entry and exit, records audit logs, and streams presence events for real time room monitoring and analytics.

---

## 2. Core Capabilities

* Mobile Barcode Verification: Fast student identity card barcode scanning using camera hardware with audio and haptic feedback.
* Real Time Presence Tracking: Instant visibility into which students are currently present inside each room across both campuses.
* Multi Organization Architecture: Different student clubs, departments, and organizations can register, configure, and manage their assigned rooms independently.
* Dual Pipeline Architecture:
  * Synchronous critical path for entry and exit validation under 150 milliseconds using Redis and PostgreSQL.
  * Asynchronous event driven pipeline using Apache Kafka for automated duty alerts, Lakehouse analytical ingestion, and live board updates.
* Offline Scan Resilience: Local storage queue ensures continuous operation during wireless network drops, followed by automatic synchronization once connectivity is restored.

---

## 3. Monorepo Structure

```
dutylog/
├── backend/                  # DutyLog backend service written in Go
│   ├── cmd/server/           # Application entrypoint
│   ├── internal/             # Config, handlers, services, repositories, kafka
│   ├── Dockerfile            # Container definition
│   └── go.mod                # Go module specification
├── mobile/                   # Mobile application built with React Native
│   ├── src/                  # Screens, components, scanner engine, state
│   ├── package.json          # React Native and Expo configuration
│   └── tsconfig.json         # TypeScript configuration
└── docs/                     # Technical documentation
    ├── WIKI.md               # User guide, setup instructions, operations
    ├── ARCHITECTURE.md       # High level system design and event pipeline
    ├── API_SPECIFICATION.md  # REST API specification and Kafka schemas
    └── adr/                  # Architectural Decision Records
        ├── ADR_001_SYNC_ASYNC_PRESENCE_PIPELINE.md
        ├── ADR_002_REACT_NATIVE_BARCODE_SCANNING.md
        ├── ADR_003_MULTI_ORGANIZATION_ROOM_TENANCY.md
        └── ADR_004_OFFLINE_FIRST_SCAN_RECONCILIATION.md
```

---

## 4. Quick Start

### Backend Service (Go)

```bash
cd backend
cp .env.example .env
go mod download
go run cmd/server/main.go
```

### Mobile Application (React Native)

```bash
cd mobile
npm install
npx expo start
```

Use the Expo Go app or an iOS/Android simulator to open and test the mobile application.

---

## 5. Team and Maintenance

* Primary Maintainer: BDC Dev Team
* Organization: Big Data Club
* Ecosystem: BDC Hub Core Platform
