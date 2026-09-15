import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Room, Occupant } from "../types";
import { fetchOccupancy, performCheckOut } from "../api/client";

interface Props {
  room: Room;
  onBack: () => void;
  onOpenScanner: () => void;
}

export const LiveRosterScreen: React.FC<Props> = ({ room, onBack, onOpenScanner }) => {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOccupancy = async () => {
    try {
      setLoading(true);
      const list = await fetchOccupancy(room.id);
      setOccupants(list);
    } catch {
      // Mock fallback occupants if offline or backend empty
      setOccupants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOccupancy();
  }, [room.id]);

  const handleQuickCheckOut = async (studentId: string) => {
    setActionLoading(studentId);
    try {
      await performCheckOut(room.id, studentId);
      setOccupants((prev) => prev.filter((o) => o.student_id !== studentId));
    } catch (err: any) {
      alert(err.message || "Failed to check out");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Rooms</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.roomTitle}>{room.name}</Text>
          <Text style={styles.occupancySubtitle}>
            {occupants.length} / {room.capacity} currently present
          </Text>
        </View>
        <TouchableOpacity onPress={loadOccupancy} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Sync</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : occupants.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Room is Empty</Text>
          <Text style={styles.emptySubtitle}>
            No students are currently checked into this room.
          </Text>
          <TouchableOpacity style={styles.emptyScanButton} onPress={onOpenScanner}>
            <Text style={styles.emptyScanButtonText}>Scan First Student</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={occupants}
          keyExtractor={(item) => item.student_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.occupantCard}>
              <View style={styles.occupantInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.occupantName}>{item.student_name}</Text>
                  {item.is_on_duty && (
                    <View style={styles.dutyBadge}>
                      <Text style={styles.dutyBadgeText}>On Duty</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.studentIdText}>ID: {item.student_id}</Text>
                <Text style={styles.timestampText}>
                  Entered: {new Date(item.check_in_at).toLocaleTimeString()}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => handleQuickCheckOut(item.student_id)}
                disabled={actionLoading === item.student_id}
              >
                {actionLoading === item.student_id ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={styles.checkoutButtonText}>Check Out</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  occupancySubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 13,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  emptyScanButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyScanButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  occupantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  occupantInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  occupantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  dutyBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dutyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  studentIdText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  timestampText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  checkoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  checkoutButtonText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
});
