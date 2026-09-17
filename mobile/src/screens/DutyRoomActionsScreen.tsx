import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Room, DutyShiftRecord, User } from "../types";
import { startDutyShift, endDutyShift, fetchCurrentShift } from "../api/client";

interface Props {
  user: User;
  room: Room;
  onBack: () => void;
  onNavigateToScan: () => void;
  onNavigateToQR: () => void;
  onNavigateToRoster: () => void;
}

export const DutyRoomActionsScreen: React.FC<Props> = ({
  user,
  room,
  onBack,
  onNavigateToScan,
  onNavigateToQR,
  onNavigateToRoster,
}) => {
  const [activeShift, setActiveShift] = useState<DutyShiftRecord | null>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadShiftStatus();
  }, [room.id]);

  const loadShiftStatus = async () => {
    try {
      setLoadingShift(true);
      const res = await fetchCurrentShift(room.id);
      if (res.has_active_shift && res.shift) {
        setActiveShift(res.shift);
      } else {
        setActiveShift(null);
      }
    } catch (e) {
      console.warn("Failed to load shift status:", e);
    } finally {
      setLoadingShift(false);
    }
  };

  const handleStartShift = async () => {
    setActionLoading(true);
    try {
      const shift = await startDutyShift(room.id, {
        id: String(user.id),
        name: user.name,
        email: user.email,
      });
      setActiveShift(shift);
      Alert.alert("Ca trực đã bắt đầu", `Người trực: ${user.name}\nPhòng: ${room.name}`);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể bắt đầu ca trực");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    Alert.alert(
      "Xác nhận kết thúc ca trực",
      "Bạn có chắc muốn kết thúc ca trực hiện tại không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Kết thúc ca",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await endDutyShift(room.id);
              setActiveShift(null);
              const durationMin = res.duration_seconds
                ? Math.round(res.duration_seconds / 60)
                : 0;
              Alert.alert(
                "Ca trực đã kết thúc",
                `Thời gian trực: ${durationMin} phút.\nCảm ơn bạn đã hoàn thành ca trực!`
              );
            } catch (err: any) {
              Alert.alert("Lỗi", err.message || "Không thể kết thúc ca trực");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Chọn phòng khác</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{room.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Room Info Banner */}
        <View style={styles.roomBanner}>
          <View style={styles.roomTagRow}>
            <Text style={styles.campusTag}>{room.campus}</Text>
            <Text style={styles.buildingTag}>Tòa {room.building} · Phòng {room.room_number}</Text>
          </View>
          <Text style={styles.roomTitle}>{room.name}</Text>
          <Text style={styles.capacityText}>
            Sức chứa: {room.capacity} người · Hiện tại: {room.current_occupancy} người
          </Text>
        </View>

        {/* Duty Shift Status Box */}
        <View style={styles.shiftCard}>
          {loadingShift ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : activeShift ? (
            <View>
              <View style={styles.shiftHeader}>
                <View style={styles.statusIndicatorActive} />
                <Text style={styles.shiftStatusActive}>CA TRỰC ĐANG HOẠT ĐỘNG</Text>
              </View>
              <Text style={styles.shiftStaffText}>
                Người trực: <Text style={{ fontWeight: "700" }}>{activeShift.duty_staff_name}</Text>
              </Text>
              <Text style={styles.shiftTimeText}>
                Bắt đầu lúc: {new Date(activeShift.start_time).toLocaleTimeString()}
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.shiftHeader}>
                <View style={styles.statusIndicatorIdle} />
                <Text style={styles.shiftStatusIdle}>CHƯA CÓ CA TRỰC</Text>
              </View>
              <Text style={styles.shiftHintText}>
                Hãy bắt đầu ca trực để quét điểm danh sinh viên vào phòng.
              </Text>
              <TouchableOpacity
                style={styles.startShiftBtn}
                onPress={handleStartShift}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.startShiftBtnText}>▶ Bắt đầu ca trực ngay</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>Tác vụ trong phòng (Duty Room Actions)</Text>

        {/* Action 1: On-Duty Operations */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <Text style={styles.actionCardIcon}>📸</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>On-Duty Operations</Text>
              <Text style={styles.actionCardDesc}>
                Quét mã sinh viên vào/ra phòng và quản lý phiên trực
              </Text>
            </View>
          </View>

          <View style={styles.buttonStack}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={onNavigateToScan}
            >
              <Text style={styles.primaryActionBtnText}>🔍 Scan Students (Quét sinh viên)</Text>
            </TouchableOpacity>

            {activeShift && (
              <TouchableOpacity
                style={styles.dangerActionBtn}
                onPress={handleEndShift}
                disabled={actionLoading}
              >
                <Text style={styles.dangerActionBtnText}>⏹ End Shift (Kết thúc ca trực)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action 2: Check-in QR Code (Standalone) */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <Text style={styles.actionCardIcon}>📱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Check-in QR Code</Text>
              <Text style={styles.actionCardDesc}>
                Tùy chọn tạo / lấy mã QR điểm danh của bản thân để người khác quét
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={onNavigateToQR}
          >
            <Text style={styles.secondaryActionBtnText}>Tạo mã QR Check-in cá nhân</Text>
          </TouchableOpacity>
        </View>

        {/* View Occupants */}
        <TouchableOpacity
          style={styles.rosterCard}
          onPress={onNavigateToRoster}
        >
          <Text style={styles.rosterIcon}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rosterTitle}>Danh sách người đang có mặt</Text>
            <Text style={styles.rosterSubtitle}>Xem danh sách sinh viên hiện đang ở trong phòng</Text>
          </View>
          <Text style={styles.rosterArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 16,
  },
  roomBanner: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },
  roomTagRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  campusTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  buildingTag: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    paddingVertical: 3,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  capacityText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 6,
  },
  shiftCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  shiftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  statusIndicatorActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  statusIndicatorIdle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F59E0B",
  },
  shiftStatusActive: {
    fontSize: 12,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  shiftStatusIdle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  shiftStaffText: {
    fontSize: 14,
    color: "#F8FAFC",
  },
  shiftTimeText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  shiftHintText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
    marginBottom: 12,
  },
  startShiftBtn: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  startShiftBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  actionCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionCardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  actionCardIcon: {
    fontSize: 26,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  actionCardDesc: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  buttonStack: {
    gap: 10,
  },
  primaryActionBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryActionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  dangerActionBtn: {
    backgroundColor: "#7F1D1D",
    borderWidth: 1,
    borderColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerActionBtnText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryActionBtn: {
    backgroundColor: "#334155",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryActionBtnText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  rosterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  rosterIcon: {
    fontSize: 22,
  },
  rosterTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  rosterSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  rosterArrow: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "700",
  },
});
