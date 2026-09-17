export interface User {
  id: number;
  email: string;
  name: string;
  roles: string[];
  is_super_admin: boolean;
  token: string;
}

export interface Organization {
  id: number;
  slug: string;
  name: string;
  description?: string;
  org_role?: string;
  room_count?: number;
}

export interface UserOrgsResponse {
  user_id: number;
  email: string;
  is_super_admin: boolean;
  count: number;
  organizations: Organization[];
}

export interface Room {
  id: string;
  organization_id?: number;
  campus: string;
  building: string;
  room_number: string;
  name: string;
  capacity: number;
  is_active: boolean;
  current_occupancy: number;
}

export interface Occupant {
  student_id: string;
  student_name: string;
  check_in_at: string;
  is_on_duty: boolean;
  is_valid_member?: boolean;
}

export interface CheckInResult {
  success: boolean;
  presence_id: number;
  room_id: string;
  student_id: string;
  student_name: string;
  check_in_at: string;
  is_on_duty: boolean;
  current_room_occupancy: number;
  is_valid_member: boolean;
  alert_color: "GREEN" | "RED";
  alert_message: string;
  scanner_id?: string;
  scanner_name?: string;
}

export interface CheckOutResult {
  success: boolean;
  room_id: string;
  student_id: string;
  check_out_at: string;
  duration_seconds: number;
  current_room_occupancy: number;
}

export interface QRToken {
  payload: string;
  expires_at: string; // ISO string
}

export interface DutyShiftRecord {
  id: number;
  organization_id: number;
  room_id: string;
  duty_staff_id: string;
  duty_staff_name: string;
  duty_staff_email: string;
  start_time: string;
  end_time: string | null;
  status: "ACTIVE" | "COMPLETED";
  duration_seconds: number;
  created_at?: string;
}

export interface PresenceHistoryItem {
  id: number;
  organization_id: number;
  room_id: string;
  student_id: string;
  student_name: string;
  check_in_at: string;
  check_out_at: string | null;
  duration_seconds: number | null;
  scan_method: string;
  is_on_duty: boolean;
  scanner_id: string;
  scanner_name: string;
  is_valid_member: boolean;
  created_at: string;
}

export interface InspectionOrgNode {
  id: number;
  slug: string;
  name: string;
  description: string;
  is_active: boolean;
  rooms: Room[];
}
