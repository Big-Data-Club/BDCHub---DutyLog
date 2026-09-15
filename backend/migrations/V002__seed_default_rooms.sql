-- ============================================================
-- DutyLog Service - V002 Seed Initial Rooms
-- Seeds Big Data Club organization and official physical rooms
-- Author: BDC Dev Team
-- ============================================================

INSERT INTO organizations (id, code, name, description)
VALUES (1, 'BDC', 'Big Data Club', 'Official Big Data Club Organization')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO rooms (id, organization_id, campus, building, room_number, name, capacity, is_active)
VALUES
    ('CS1-605-C6', 1, 'Campus 1', 'C6', '605', 'Big Data Club Room 605 C6', 30, true),
    ('CS1-303-B9', 1, 'Campus 1', 'B9', '303', 'AI & Analytics Room 303 B9', 25, true),
    ('CS2-710-H6', 1, 'Campus 2', 'H6', '710', 'Branch Room 710 H6', 20, true)
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    capacity = EXCLUDED.capacity,
    is_active = EXCLUDED.is_active;
