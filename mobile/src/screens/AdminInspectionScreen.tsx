import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  InspectionOrgNode,
  Room,
  PresenceHistoryItem,
  DutyShiftRecord,
} from "../types";
import {
  fetchInspectionHierarchy,
  fetchPresenceHistory,
  fetchDutyHistory,
} from "../api/client";

interface Props {
  onBack: () => void;
}

export const AdminInspectionScreen: React.FC<Props> = ({ onBack }) => {
  const [hierarchy, setHierarchy] = useState<InspectionOrgNode[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<InspectionOrgNode | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState<"PRESENCE" | "DUTY">("PRESENCE");

  const [presenceHistory, setPresenceHistory] = useState<PresenceHistoryItem[]>([]);
  const [dutyHistory, setDutyHistory] = useState<DutyShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const data = await fetchInspectionHierarchy();
      setHierarchy(data);
      if (data.length > 0) {
        setSelectedOrg(data[0]);
        if (data[0].rooms && data[0].rooms.length > 0) {
          setSelectedRoom(data[0].rooms[0]);
        }
      }
    } catch (e) {
      console.warn("Failed to load hierarchy:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      loadRoomDetails(selectedRoom.id);
    }
  }, [selectedRoom, activeTab]);

  const loadRoomDetails = async (roomId: string) => {
    try {
      setDetailsLoading(true);
      if (activeTab === "PRESENCE") {
        const history = await fetchPresenceHistory(roomId);
        setPresenceHistory(history);
      } else {
        const shifts = await fetchDutyHistory(roomId);
        setDutyHistory(shifts);
      }
    } catch (e) {
      console.warn("Failed to load room details:", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectOrg = (org: InspectionOrgNode) => {
    setSelectedOrg(org);
    if (org.rooms && org.rooms.length > 0) {
      setSelectedRoom(org.rooms[0]);
    } else {
      setSelectedRoom(null);
      setPresenceHistory([]);
      setDutyHistory([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerBadge}>SUPER ADMIN DASHBOARD</Text>
          <Text style={styles.headerTitle}>Bottom-Up System Inspection</Text>
        </View>
        <TouchableOpacity onPress={() => selectedRoom && loadRoomDetails(selectedRoom.id)} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải cấu trúc toàn hệ thống...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Level 1: Organization Hierarchy Selector */}
          <View style={styles.levelSection}>
            <Text style={styles.levelLabel}>1. Tổ chức (Organization):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {hierarchy.map((org) => {
                const isSelected = selectedOrg?.id === org.id;
                return (
                  <TouchableOpacity
                    key={org.id}
                    style={[styles.orgChip, isSelected && styles.orgChipSelected]}
                    onPress={() => handleSelectOrg(org)}
                  >
                    <Text style={[styles.orgChipText, isSelected && styles.orgChipTextSelected]}>
                      🏢 {org.name}
                    </Text>
                    <View style={styles.badgeSmall}>
                      <Text style={styles.badgeSmallText}>{org.rooms.length} phòng</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Level 2: Room Selector */}
          <View style={styles.levelSection}>
            <Text style={styles.levelLabel}>2. Phòng trực (Room):</Text>
            {selectedOrg && selectedOrg.rooms.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {selectedOrg.rooms.map((room) => {
                  const isSelected = selectedRoom?.id === room.id;
                  return (
                    <TouchableOpacity
                      key={room.id}
                      style={[styles.roomChip, isSelected && styles.roomChipSelected]}
                      onPress={() => setSelectedRoom(room)}
                    >
                      <Text style={[styles.roomChipText, isSelected && styles.roomChipTextSelected]}>
                        {room.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.emptyPrompt}>Không có phòng trực nào trong tổ chức này.</Text>
            )}
          </View>

          {/* Level 3: Details Tabs (Check-in/out History vs Duty History) */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "PRESENCE" && styles.tabButtonActive]}
              onPress={() => setActiveTab("PRESENCE")}
            >
              <Text style={[styles.tabButtonText, activeTab === "PRESENCE" && styles.tabButtonTextActive]}>
                📋 Check-in/Check-out History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "DUTY" && styles.tabButtonActive]}
              onPress={() => setActiveTab("DUTY")}
            >
              <Text style={[styles.tabButtonText, activeTab === "DUTY" && styles.tabButtonTextActive]}>
                ⏱ Duty History (Ca trực)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Data List Content */}
          {detailsLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : activeTab === "PRESENCE" ? (
            <FlatList
              data={presenceHistory}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isInvalid = !item.is_valid_member;
                return (
                  <View style={[styles.historyCard, isInvalid && styles.historyCardInvalid]}>
                    <View style={styles.historyCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.studentName, isInvalid && styles.studentNameInvalid]}>
                          {item.student_name}
                        </Text>
                        <Text style={styles.studentIdText}>MSSV: {item.student_id}</Text>
                      </View>

                      {/* Display RED badge if invalid */}
                      {isInvalid ? (
                        <View style={styles.invalidBadge}>
                          <Text style={styles.invalidBadgeText}>🚨 KHÔNG THUỘC TỔ CHỨC</Text>
                        </View>
                      ) : (
                        <View style={styles.validBadge}>
                          <Text style={styles.validBadgeText}>✓ HỢP LỆ</Text>
                        </View>
                      )}
                    </View>

                    {/* Check-in / Check-out History Details: Timestamp & Scanner Identity */}
                    <View style={styles.historyDetails}>
                      <Text style={styles.detailText}>
                        🕒 Vào phòng: <Text style={{ fontWeight: "700" }}>{new Date(item.check_in_at).toLocaleString()}</Text>
                      </Text>
                      {item.check_out_at && (
                        <Text style={styles.detailText}>
                          🚪 Rời phòng: {new Date(item.check_out_at).toLocaleString()} ({Math.round((item.duration_seconds || 0) / 60)} phút)
                        </Text>
                      )}
                      <Text style={[styles.detailText, styles.scannerIdentityText]}>
                        👤 Người quét (Scanner): <Text style={{ fontWeight: "700" }}>{item.scanner_name || "Trực phòng"}</Text> {item.scanner_id ? `(ID: ${item.scanner_id})` : ""}
                      </Text>
                      <Text style={styles.detailSubText}>Phương thức: {item.scan_method}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyPrompt}>Chưa có lịch sử điểm danh nào trong phòng này.</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={dutyHistory}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.dutyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dutyStaffName}>{item.duty_staff_name}</Text>
                      {item.duty_staff_email ? (
                        <Text style={styles.dutyStaffEmail}>{item.duty_staff_email}</Text>
                      ) : null}
                    </View>

                    <View style={item.status === "ACTIVE" ? styles.dutyActiveBadge : styles.dutyCompletedBadge}>
                      <Text style={item.status === "ACTIVE" ? styles.dutyActiveBadgeText : styles.dutyCompletedBadgeText}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Duty History Details: Shift start time, Shift end time */}
                  <View style={styles.historyDetails}>
                    <Text style={styles.detailText}>
                      ▶ Giờ bắt đầu: <Text style={{ fontWeight: "700" }}>{new Date(item.start_time).toLocaleString()}</Text>
                    </Text>
                    <Text style={styles.detailText}>
                      ⏹ Giờ kết thúc: <Text style={{ fontWeight: "700" }}>{item.end_time ? new Date(item.end_time).toLocaleString() : "Đang trong ca trực"}</Text>
                    </Text>
                    <Text style={styles.detailSubText}>
                      Tổng thời lượng: {Math.round(item.duration_seconds / 60)} phút
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyPrompt}>Chưa có lịch sử ca trực nào trong phòng này.</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#1E293B",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#1E293B",
    borderRadius: 8,
  },
  refreshBtnText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#94A3B8",
    marginTop: 10,
    fontSize: 13,
  },
  levelSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 6,
  },
  chipRow: {
    gap: 8,
    paddingRight: 16,
  },
  orgChip: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orgChipSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#1E3A8A",
  },
  orgChipText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  orgChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  badgeSmall: {
    backgroundColor: "#0F172A",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeSmallText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  roomChip: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  roomChipSelected: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  roomChipText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  roomChipTextSelected: {
    color: "#38BDF8",
    fontWeight: "700",
  },
  emptyPrompt: {
    color: "#64748B",
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 6,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#1E293B",
  },
  tabButtonActive: {
    backgroundColor: "#2563EB",
  },
  tabButtonText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  // Invalid Access Highlighted in RED on Admin Dashboard
  historyCardInvalid: {
    backgroundColor: "#450A0A",
    borderColor: "#DC2626",
    borderWidth: 2,
  },
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  studentNameInvalid: {
    color: "#FCA5A5",
  },
  studentIdText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  validBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  validBadgeText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "800",
  },
  invalidBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invalidBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  historyDetails: {
    gap: 3,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 8,
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#E2E8F0",
  },
  scannerIdentityText: {
    color: "#38BDF8",
    marginTop: 2,
  },
  detailSubText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  dutyCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dutyStaffName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  dutyStaffEmail: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  dutyActiveBadge: {
    backgroundColor: "#065F46",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dutyActiveBadgeText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "800",
  },
  dutyCompletedBadge: {
    backgroundColor: "#334155",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dutyCompletedBadgeText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
});
