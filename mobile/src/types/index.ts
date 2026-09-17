export interface Room {
  id: string;
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
