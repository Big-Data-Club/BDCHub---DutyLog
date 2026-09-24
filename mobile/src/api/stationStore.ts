import {
  Occupant,
  PresenceHistoryItem,
  DutyShiftRecord,
  CheckInResult,
  CheckOutResult,
} from "../types";

export interface RoomCacheData {
  occupants: Occupant[];
  presenceHistory: PresenceHistoryItem[];
  dutyHistory: DutyShiftRecord[];
  activeShift: DutyShiftRecord | null;
  historyOffset: number;
  hasMoreHistory: boolean;
  initialized: boolean;
}

const memoryStore: Record<string, RoomCacheData> = {};

type Listener = (roomId: string, data: RoomCacheData) => void;
const listeners = new Set<Listener>();

export function subscribeToStationStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(roomId: string) {
  const data = memoryStore[roomId];
  if (data) {
    listeners.forEach((fn) => {
      try {
        fn(roomId, data);
      } catch (err) {
        console.warn("Error in stationStore listener:", err);
      }
    });
  }
}

export function getStationCache(roomId: string): RoomCacheData {
  if (!memoryStore[roomId]) {
    memoryStore[roomId] = {
      occupants: [],
      presenceHistory: [],
      dutyHistory: [],
      activeShift: null,
      historyOffset: 0,
      hasMoreHistory: true,
      initialized: false,
    };
  }
  return memoryStore[roomId];
}

export function updateStationCache(
  roomId: string,
  updater: (prev: RoomCacheData) => Partial<RoomCacheData>
): RoomCacheData {
  const current = getStationCache(roomId);
  const updates = updater(current);
  const next: RoomCacheData = {
    ...current,
    ...updates,
  };
  memoryStore[roomId] = next;
  notify(roomId);
  return next;
}

// ── Write-Ahead helper: Record Check-in directly from Scanner Screen ─────────
export function recordCheckInOptimistic(
  roomId: string,
  result: CheckInResult,
  scannerName: string,
  organizationId: number = 0
) {
  const now = new Date();
  const nowMs = now.getTime();
  const sId = result.student_id;
  const sName = result.student_name || `MSSV ${sId}`;

  updateStationCache(roomId, (prev) => {
    // 1. Upsert occupant in memory
    const existingIndex = prev.occupants.findIndex((o) => o.student_id === sId);
    let newOccupants = [...prev.occupants];
    const newOccupant: Occupant = {
      student_id: sId,
      student_name: sName,
      check_in_at: now.toISOString(),
      is_on_duty: result.is_on_duty ?? false,
      is_valid_member: result.is_valid_member,
      is_system_user: result.is_system_user,
    };
    if (existingIndex >= 0) {
      newOccupants[existingIndex] = newOccupant;
    } else {
      newOccupants = [newOccupant, ...newOccupants];
    }

    // 2. Prepend presence item in memory
    const tempPresenceItem: PresenceHistoryItem = {
      id: -nowMs,
      organization_id: organizationId,
      room_id: roomId,
      student_id: sId,
      student_name: sName,
      check_in_at: now.toISOString(),
      check_out_at: null,
      duration_seconds: null,
      scan_method: "SCAN",
      is_on_duty: false,
      scanner_id: "0",
      scanner_name: scannerName,
      is_valid_member: result.is_valid_member,
      is_system_user: result.is_system_user,
      created_at: now.toISOString(),
    };

    return {
      occupants: newOccupants,
      presenceHistory: [tempPresenceItem, ...prev.presenceHistory],
    };
  });
}

// ── Write-Ahead helper: Record Check-out directly from Scanner Screen ────────
export function recordCheckOutOptimistic(
  roomId: string,
  result: CheckOutResult,
  scannerName: string,
  organizationId: number = 0
) {
  const now = new Date();
  const nowMs = now.getTime();
  const sId = result.student_id;

  updateStationCache(roomId, (prev) => {
    // 1. Remove occupant from memory
    const leaving = prev.occupants.find((o) => o.student_id === sId);
    const newOccupants = prev.occupants.filter((o) => o.student_id !== sId);

    // 2. Prepend check-out item in memory
    const staySecs = result.duration_seconds || 1800;
    const tempPresenceItem: PresenceHistoryItem = {
      id: -nowMs,
      organization_id: organizationId,
      room_id: roomId,
      student_id: sId,
      student_name: leaving?.student_name || `MSSV ${sId}`,
      check_in_at: leaving?.check_in_at || new Date(nowMs - staySecs * 1000).toISOString(),
      check_out_at: now.toISOString(),
      duration_seconds: staySecs,
      scan_method: "SCAN",
      is_on_duty: false,
      scanner_id: "0",
      scanner_name: scannerName,
      is_valid_member: leaving?.is_valid_member ?? true,
      is_system_user: leaving?.is_system_user,
      created_at: now.toISOString(),
    };

    return {
      occupants: newOccupants,
      presenceHistory: [tempPresenceItem, ...prev.presenceHistory],
    };
  });
}
