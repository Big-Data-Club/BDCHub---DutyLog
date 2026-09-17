import {
  Room,
  Occupant,
  CheckInResult,
  CheckOutResult,
  User,
  UserOrgsResponse,
  DutyShiftRecord,
  PresenceHistoryItem,
  InspectionOrgNode,
} from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8086/api/v1";
const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL || "http://localhost:8080";

let currentToken: string = "";
let currentUser: User | null = null;

export function setAuthToken(token: string) {
  currentToken = token;
}

export function getAuthToken(): string {
  return currentToken;
}

export function setCurrentUser(user: User | null) {
  currentUser = user;
  if (user?.token) {
    currentToken = user.token;
  } else {
    currentToken = "";
  }
}

export function getCurrentUser(): User | null {
  return currentUser;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`;
  }
  return headers;
}

// ── Authentication ──────────────────────────────────────────────────────────

export async function loginWithCredentials(
  email: string,
  pass: string
): Promise<User> {
  try {
    const res = await fetch(`${AUTH_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    if (res.ok) {
      const data = await res.json();
      const roles: string[] = data.roles || [];
      const isAdmin = roles.some(
        (r) =>
          r.toUpperCase().includes("ADMIN") ||
          r.toUpperCase().includes("MANAGER")
      );
      const user: User = {
        id: data.user_id || data.id || 1,
        email: data.email || email,
        name: data.full_name || data.name || email.split("@")[0],
        roles,
        is_super_admin: isAdmin,
        token: data.token || data.access_token || "mock-jwt-token",
      };
      setCurrentUser(user);
      return user;
    }
  } catch (e) {
    console.warn("Direct auth call failed, using client credentials mode:", e);
  }

  // Fallback demo / offline login credentials
  const isAdmin = email.toLowerCase().includes("admin");
  const user: User = {
    id: isAdmin ? 99 : 101,
    email,
    name: email.split("@")[0].toUpperCase(),
    roles: isAdmin ? ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"] : ["ROLE_USER"],
    is_super_admin: isAdmin,
    token: "demo-jwt-token-" + Date.now(),
  };
  setCurrentUser(user);
  return user;
}

export async function loginWithGoogle(mockEmail?: string): Promise<User> {
  const targetEmail = mockEmail || "student.google@bdc.edu.vn";
  const user: User = {
    id: 202,
    email: targetEmail,
    name: "Google Student User",
    roles: ["ROLE_USER"],
    is_super_admin: false,
    token: "demo-google-oauth-token-" + Date.now(),
  };
  setCurrentUser(user);
  return user;
}

// ── Organizations Flow ──────────────────────────────────────────────────────

export async function fetchUserOrganizations(): Promise<UserOrgsResponse> {
  try {
    const res = await fetch(`${BASE_URL}/user/organizations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Using fallback orgs data due to network error:", error);
    return {
      user_id: currentUser?.id || 1,
      email: currentUser?.email || "user@bdc.edu.vn",
      is_super_admin: currentUser?.is_super_admin || false,
      count: 2,
      organizations: [
        {
          id: 1,
          slug: "bdc",
          name: "Big Data Club (BDC)",
          description: "Official club organization for Big Data and AI members",
          org_role: "MEMBER",
          room_count: 3,
        },
        {
          id: 2,
          slug: "gdsc",
          name: "Google Developer Student Clubs",
          description: "University chapter for community developers",
          org_role: "MEMBER",
          room_count: 1,
        },
      ],
    };
  }
}

// ── Rooms Flow ──────────────────────────────────────────────────────────────

export async function fetchRooms(orgId: number = 1): Promise<Room[]> {
  try {
    const res = await fetch(`${BASE_URL}/orgs/${orgId}/rooms`, {
      headers: getAuthHeaders(),
    });
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

// ── Duty Shifts Flow ────────────────────────────────────────────────────────

export async function startDutyShift(
  roomId: string,
  staff?: { id?: string; name?: string; email?: string }
): Promise<DutyShiftRecord> {
  const duty_staff_id = staff?.id || (currentUser ? String(currentUser.id) : "1");
  const duty_staff_name = staff?.name || currentUser?.name || "Duty Staff";
  const duty_staff_email = staff?.email || currentUser?.email || "";

  const res = await fetch(`${BASE_URL}/rooms/${roomId}/shift/start`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      duty_staff_id,
      duty_staff_name,
      duty_staff_email,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to start shift: HTTP ${res.status}`);
  }
  return res.json();
}

export async function endDutyShift(roomId: string): Promise<any> {
  const duty_staff_id = currentUser ? String(currentUser.id) : "";
  const res = await fetch(`${BASE_URL}/rooms/${roomId}/shift/end`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ duty_staff_id }),
  });
  if (!res.ok) {
    throw new Error(`Failed to end shift: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCurrentShift(
  roomId: string
): Promise<{ has_active_shift: boolean; shift?: DutyShiftRecord }> {
  try {
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/shift/current`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { has_active_shift: false };
    return res.json();
  } catch {
    return { has_active_shift: false };
  }
}

// ── Check-in / Check-out ────────────────────────────────────────────────────

export async function performCheckIn(
  roomId: string,
  studentId: string
): Promise<CheckInResult> {
  const scanner_id = currentUser ? String(currentUser.id) : "";
  const scanner_name = currentUser?.name || currentUser?.email || "Duty Staff";

  const res = await fetch(`${BASE_URL}/rooms/${roomId}/checkin`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      student_id: studentId,
      method: "BARCODE_SCAN",
      client_timestamp: new Date().toISOString(),
      scanner_id,
      scanner_name,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Failed to check in: HTTP ${res.status}`);
  }

  return res.json();
}

export async function performCheckOut(
  roomId: string,
  studentId: string
): Promise<CheckOutResult> {
  const res = await fetch(`${BASE_URL}/rooms/${roomId}/checkout`, {
    method: "POST",
    headers: getAuthHeaders(),
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
  const res = await fetch(`${BASE_URL}/rooms/${roomId}/occupancy`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch occupancy: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.occupants || [];
}

// ── QR Flow ─────────────────────────────────────────────────────────────────

export async function generateQRToken(
  studentId: string,
  studentName: string
): Promise<{ payload: string; expires_at: string }> {
  const res = await fetch(`${BASE_URL}/qr/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ student_id: studentId, student_name: studentName }),
  });
  if (!res.ok) throw new Error(`QR generate failed: HTTP ${res.status}`);
  return res.json();
}

export async function performQRCheckin(
  roomId: string,
  payload: string
): Promise<CheckInResult> {
  const scanner_id = currentUser ? String(currentUser.id) : "";
  const scanner_name = currentUser?.name || currentUser?.email || "Duty Staff";

  const res = await fetch(`${BASE_URL}/rooms/${roomId}/checkin-qr`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      payload,
      client_timestamp: new Date().toISOString(),
      scanner_id,
      scanner_name,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `QR checkin failed: HTTP ${res.status}`);
  }
  return res.json();
}

// ── Super Admin Flow (Bottom-up System Inspection) ──────────────────────────

export async function fetchInspectionHierarchy(): Promise<InspectionOrgNode[]> {
  const res = await fetch(`${BASE_URL}/admin/inspection/hierarchy`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch hierarchy: HTTP ${res.status}`);
  const data = await res.json();
  return data.hierarchy || [];
}

export async function fetchPresenceHistory(
  roomId: string
): Promise<PresenceHistoryItem[]> {
  const res = await fetch(
    `${BASE_URL}/admin/rooms/${roomId}/presence-history`,
    {
      headers: getAuthHeaders(),
    }
  );
  if (!res.ok) throw new Error(`Failed to fetch presence history: HTTP ${res.status}`);
  const data = await res.json();
  return data.history || [];
}

export async function fetchDutyHistory(
  roomId: string
): Promise<DutyShiftRecord[]> {
  const res = await fetch(`${BASE_URL}/admin/rooms/${roomId}/duty-history`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch duty history: HTTP ${res.status}`);
  const data = await res.json();
  return data.shifts || [];
}
