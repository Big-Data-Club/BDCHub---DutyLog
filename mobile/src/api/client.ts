import { Room, Occupant, CheckInResult, CheckOutResult } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8086/api/v1";

export async function fetchRooms(orgId: number = 1): Promise<Room[]> {
  try {
    const res = await fetch(`${BASE_URL}/orgs/${orgId}/rooms`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.rooms || [];
  } catch (error) {
    console.warn("Using fallback room data due to network error:", error);
    return [
      {
        id: "CS1-605-C6",
        campus: "Campus 1",
        building: "C6",
        room_number: "605",
        name: "Big Data Club Room 605 C6",
        capacity: 30,
        is_active: true,
        current_occupancy: 0,
      },
      {
        id: "CS1-303-B9",
        campus: "Campus 1",
        building: "B9",
        room_number: "303",
        name: "AI & Analytics Room 303 B9",
        capacity: 25,
        is_active: true,
        current_occupancy: 0,
      },
      {
        id: "CS2-710-H6",
        campus: "Campus 2",
        building: "H6",
        room_number: "710",
        name: "Branch Room 710 H6",
        capacity: 20,
        is_active: true,
        current_occupancy: 0,
      },
    ];
  }
}

export async function performCheckIn(roomId: string, studentId: string): Promise<CheckInResult> {
  const res = await fetch(`${BASE_URL}/rooms/${roomId}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      method: "BARCODE_SCAN",
      client_timestamp: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to check in: HTTP ${res.status}`);
  }

  return res.json();
}

export async function performCheckOut(roomId: string, studentId: string): Promise<CheckOutResult> {
  const res = await fetch(`${BASE_URL}/rooms/${roomId}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      method: "BARCODE_SCAN",
      client_timestamp: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to check out: HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchOccupancy(roomId: string): Promise<Occupant[]> {
  const res = await fetch(`${BASE_URL}/rooms/${roomId}/occupancy`);
  if (!res.ok) {
    throw new Error(`Failed to fetch occupancy: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.occupants || [];
}

export async function generateQRToken(
  studentId: string,
  studentName: string
): Promise<{ payload: string; expires_at: string }> {
  const res = await fetch(`${BASE_URL}/qr/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, student_name: studentName }),
  });
  if (!res.ok) throw new Error(`QR generate failed: HTTP ${res.status}`);
  return res.json();
}

export async function performQRCheckin(
  roomId: string,
  payload: string
): Promise<CheckInResult> {
  const res = await fetch(`${BASE_URL}/rooms/${roomId}/checkin-qr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payload,
      client_timestamp: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `QR checkin failed: HTTP ${res.status}`);
  }
  return res.json();
}
