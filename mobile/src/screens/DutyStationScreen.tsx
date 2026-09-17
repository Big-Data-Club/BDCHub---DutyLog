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
  Image,
  Alert,
  Modal,
} from "react-native";
import {
  Room,
  Organization,
  User,
  Occupant,
  PresenceHistoryItem,
  DutyShiftRecord,
} from "../types";
import {
  fetchOccupancy,
  performCheckOut,
  startDutyShift,
  endDutyShift,
  fetchCurrentShift,
  fetchPresenceHistory,
  fetchDutyHistory,
} from "../api/client";

interface Props {
  user: User;
  organization: Organization;
  room: Room;
  onBackToRooms: () => void;
  onOpenScanner: (mode: "BARCODE" | "QR_SCAN") => void;
  onOpenPersonalQR: () => void;
  onLogout: () => void;
  onNavigateToInspection?: () => void;
}

export const DutyStationScreen: React.FC<Props> = ({
  user,
  organization,
  room,
  onBackToRooms,
  onOpenScanner,
  onOpenPersonalQR,
  onLogout,
  onNavigateToInspection,
}) => {
  const [scanType, setScanType] = useState<"BARCODE" | "QR_SCAN">("BARCODE");
  const [activeTab, setActiveTab] = useState<"HISTORY" | "OCCUPANTS" | "SHIFTS">("HISTORY");

  // Data states
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [presenceHistory, setPresenceHistory] = useState<PresenceHistoryItem[]>([]);
  const [dutyHistory, setDutyHistory] = useState<DutyShiftRecord[]>([]);
  const [activeShift, setActiveShift] = useState<DutyShiftRecord | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shiftDurationSeconds, setShiftDurationSeconds] = useState(0);

  useEffect(() => {
    loadStationData();
  }, [room.id]);

  // Live ticker for active shift duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (activeShift) {
      const startMs = new Date(activeShift.start_time).getTime();
      timer = setInterval(() => {
        const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setShiftDurationSeconds(diff);
      }, 1000);
    } else {
      setShiftDurationSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeShift]);

  const loadStationData = async () => {
    try {
      setLoading(true);
      // Parallel fetch for low latency
      const [shiftRes, occList, histList, shiftsList] = await Promise.all([
        fetchCurrentShift(room.id).catch(() => ({ has_active_shift: false, shift: undefined })),
        fetchOccupancy(room.id).catch(() => []),
        fetchPresenceHistory(room.id).catch(() => []),
        fetchDutyHistory(room.id).catch(() => []),
      ]);

      if (shiftRes.has_active_shift && shiftRes.shift) {
        setActiveShift(shiftRes.shift);
      } else {
        setActiveShift(null);
      }

      setOccupants(occList);
      setPresenceHistory(histList);
      setDutyHistory(shiftsList);
    } catch (e) {
      console.warn("Failed to load station data:", e);
    } finally {
      setLoading(false);
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
      loadStationData();
      Alert.alert("Ca trực đã kích hoạt", `Chào ${user.name}, ca trực tại ${room.name} đã được bắt đầu.`);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể bắt đầu ca trực");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = () => {
    Alert.alert(
      "Kết thúc ca trực",
      "Xác nhận kết thúc phiên trực hiện tại?",
      [
        { text: "Tiếp tục trực", style: "cancel" },
        {
          text: "Kết thúc ngay",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await endDutyShift(room.id);
              setActiveShift(null);
              loadStationData();
              const mins = res.duration_seconds ? Math.round(res.duration_seconds / 60) : 0;
              Alert.alert("Đã kết thúc ca trực", `Tổng thời gian trực: ${mins} phút. Dữ liệu đã được lưu.`);
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

  const handleQuickCheckOut = async (studentId: string) => {
    try {
      await performCheckOut(room.id, studentId);
      loadStationData();
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể check-out sinh viên");
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? "0" + n : String(n));
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const currentCount = occupants.length;
  const capacity = room.capacity || 30;
  const occupancyPercent = Math.min(100, Math.round((currentCount / capacity) * 100));

  return (
    <SafeAreaView style={styles.container}>
      {/* ── High-Tech Top Header ────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Image
            source={require("../../assets/bdclogo.png")}
            style={styles.logoMini}
            resizeMode="contain"
          />
          <View>
            <View style={styles.roomTagRow}>
              <Text style={styles.roomCodeBadge}>{room.id}</Text>
              <Text style={styles.orgSlugBadge}>{organization.slug.toUpperCase()}</Text>
            </View>
            <Text style={styles.roomNameText} numberOfLines={1}>{room.name}</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          {user.is_super_admin && onNavigateToInspection && (
            <TouchableOpacity style={styles.superAdminBtn} onPress={onNavigateToInspection} activeOpacity={0.8}>
              <Text style={styles.superAdminBtnText}>🛡️ Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.changeRoomBtn} onPress={onBackToRooms} activeOpacity={0.8}>
            <Text style={styles.changeRoomBtnText}>Đổi phòng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.personalQRBtn} onPress={onOpenPersonalQR} activeOpacity={0.8}>
            <Text style={styles.personalQRBtnText}>📱 QR của tôi</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Status HUD / Shift Card ───────────────────────────────────── */}
        <View style={styles.hudCard}>
          <View style={styles.hudGlowTop} />

          <View style={styles.hudRowBetween}>
            <View style={styles.shiftStatusRow}>
              <View style={activeShift ? styles.statusDotActive : styles.statusDotIdle} />
              <Text style={activeShift ? styles.statusTextActive : styles.statusTextIdle}>
                {activeShift ? "CA TRỰC ĐANG HOẠT ĐỘNG" : "CHƯA BẮT ĐẦU CA TRỰC"}
              </Text>
            </View>

            {activeShift && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>⏱️ {formatTimer(shiftDurationSeconds)}</Text>
              </View>
            )}
          </View>

          <View style={styles.hudDetailsRow}>
            <Text style={styles.hudStaffLabel}>
              Người trực: <Text style={styles.hudStaffValue}>{activeShift?.duty_staff_name || user.name}</Text>
            </Text>
            {activeShift && (
              <Text style={styles.hudTimeLabel}>
                Bắt đầu: {new Date(activeShift.start_time).toLocaleTimeString()}
              </Text>
            )}
          </View>

          {/* Shift control button */}
          {activeShift ? (
            <TouchableOpacity
              style={styles.endShiftBtn}
              onPress={handleEndShift}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.endShiftBtnText}>⏹ KẾT THÚC CA TRỰC</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startShiftBtn}
              onPress={handleStartShift}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="#070B14" size="small" />
              ) : (
                <Text style={styles.startShiftBtnText}>▶ BẮT ĐẦU CA TRỰC NGAY</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── HERO SCAN STATION ("Bấm vô là quét") ─────────────────────── */}
        <View style={styles.heroScanCard}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroStationTag}>TRẠM ĐIỂM DANH HIỆN DIỆN</Text>
              <Text style={styles.heroStationTitle}>Bấm để quét sinh viên</Text>
            </View>
            <View style={styles.scannerTypePills}>
              <TouchableOpacity
                style={[styles.typePill, scanType === "BARCODE" && styles.typePillActive]}
                onPress={() => setScanType("BARCODE")}
              >
                <Text style={[styles.typePillText, scanType === "BARCODE" && styles.typePillTextActive]}>
                  🏷️ Barcode
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typePill, scanType === "QR_SCAN" && styles.typePillActive]}
                onPress={() => setScanType("QR_SCAN")}
              >
                <Text style={[styles.typePillText, scanType === "QR_SCAN" && styles.typePillTextActive]}>
                  🔳 Mã QR
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Central Glowing Scanner Trigger Button */}
          <TouchableOpacity
            style={styles.bigScanTrigger}
            onPress={() => onOpenScanner(scanType)}
            activeOpacity={0.88}
          >
            <View style={styles.radarRingOuter}>
              <View style={styles.radarRingInner}>
                <Text style={styles.scannerBigIcon}>
                  {scanType === "BARCODE" ? "📷" : "⚡"}
                </Text>
              </View>
            </View>

            <View style={styles.scanPromptTextContainer}>
              <Text style={styles.scanPromptTitle}>
                {scanType === "BARCODE" ? "MỞ CAMERA QUÉT MÃ THẺ" : "MỞ CAMERA QUÉT MÃ QR"}
              </Text>
              <Text style={styles.scanPromptDesc}>
                Tự động định danh · Kiểm tra quyền Org · Cảnh báo đỏ nếu không thuộc CLB
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── High-Tech Metrics Row (Banking style) ────────────────────── */}
        <View style={styles.metricsRow}>
          {/* Card 1: Live Occupancy */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ĐANG TRONG PHÒNG</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValueLarge}>{currentCount}</Text>
              <Text style={styles.metricValueSub}>/ {capacity}</Text>
            </View>
            <View style={styles.metricBarTrack}>
              <View
                style={[
                  styles.metricBarFill,
                  {
                    width: `${occupancyPercent}%`,
                    backgroundColor: occupancyPercent > 80 ? "#EF4444" : "#00F0FF",
                  },
                ]}
              />
            </View>
          </View>

          {/* Card 2: Lấp đầy */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TỈ LỆ LẤP ĐẦY</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValueLarge}>{occupancyPercent}%</Text>
            </View>
            <Text style={styles.metricFootnote}>
              {currentCount >= capacity ? "⚠ Đạt giới hạn sức chứa" : "Phòng đang hoạt động tốt"}
            </Text>
          </View>
        </View>

        {/* ── Quick-Switch Segmented Control ───────────────────────────── */}
        <View style={styles.switchTabsContainer}>
          <TouchableOpacity
            style={[styles.switchTabBtn, activeTab === "HISTORY" && styles.switchTabBtnActive]}
            onPress={() => setActiveTab("HISTORY")}
            activeOpacity={0.8}
          >
            <Text style={[styles.switchTabBtnText, activeTab === "HISTORY" && styles.switchTabBtnTextActive]}>
              📋 Lịch sử quét
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchTabBtn, activeTab === "OCCUPANTS" && styles.switchTabBtnActive]}
            onPress={() => setActiveTab("OCCUPANTS")}
            activeOpacity={0.8}
          >
            <Text style={[styles.switchTabBtnText, activeTab === "OCCUPANTS" && styles.switchTabBtnTextActive]}>
              👥 Hiện diện ({currentCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchTabBtn, activeTab === "SHIFTS" && styles.switchTabBtnActive]}
            onPress={() => setActiveTab("SHIFTS")}
            activeOpacity={0.8}
          >
            <Text style={[styles.switchTabBtnText, activeTab === "SHIFTS" && styles.switchTabBtnTextActive]}>
              ⏱️ Ca trực
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab Content ──────────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.tabLoadingBox}>
            <ActivityIndicator size="small" color="#00F0FF" />
            <Text style={styles.tabLoadingText}>Đang cập nhật dữ liệu...</Text>
          </View>
        ) : activeTab === "HISTORY" ? (
          /* TAB 1: Check-in / Check-out History with RED Alerts */
          <View style={styles.tabSection}>
            <Text style={styles.tabSectionHeader}>LỊCH SỬ ĐIỂM DANH GẦN ĐÂY</Text>
            {presenceHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>Chưa có lượt quét nào trong phòng này.</Text>
              </View>
            ) : (
              presenceHistory.slice(0, 30).map((item) => {
                const isInvalid = !item.is_valid_member;
                return (
                  <View
                    key={item.id}
                    style={[styles.historyItemCard, isInvalid && styles.historyItemInvalid]}
                  >
                    <View style={styles.historyTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyStudentName, isInvalid && styles.historyStudentNameInvalid]}>
                          {item.student_name}
                        </Text>
                        <Text style={styles.historyStudentId}>MSSV: {item.student_id}</Text>
                      </View>

                      {isInvalid ? (
                        <View style={styles.invalidBadgePill}>
                          <Text style={styles.invalidBadgePillText}>🚨 KHÔNG THUỘC ORG</Text>
                        </View>
                      ) : (
                        <View style={styles.validBadgePill}>
                          <Text style={styles.validBadgePillText}>✓ HỢP LỆ</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.historyMetaRow}>
                      <Text style={styles.historyMetaText}>
                        🕒 Vào: <Text style={{ fontWeight: "700" }}>{new Date(item.check_in_at).toLocaleTimeString()}</Text>
                      </Text>
                      {item.check_out_at && (
                        <Text style={styles.historyMetaText}>
                          🚪 Ra: {new Date(item.check_out_at).toLocaleTimeString()}
                        </Text>
                      )}
                      <Text style={styles.historyScannerText}>
                        👤 Quét bởi: <Text style={{ fontWeight: "700" }}>{item.scanner_name || "Trực phòng"}</Text>
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : activeTab === "OCCUPANTS" ? (
          /* TAB 2: Live Room Occupants */
          <View style={styles.tabSection}>
            <Text style={styles.tabSectionHeader}>SINH VIÊN ĐANG CÓ MẶT TRONG PHÒNG</Text>
            {occupants.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>Phòng hiện tại chưa có ai điểm danh vào.</Text>
              </View>
            ) : (
              occupants.map((occ) => (
                <View key={occ.student_id} style={styles.occupantItemCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.occupantNameRow}>
                      <Text style={styles.occupantName}>{occ.student_name}</Text>
                      {occ.is_on_duty && (
                        <View style={styles.dutyMemberBadge}>
                          <Text style={styles.dutyMemberBadgeText}>Trực phòng</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.occupantSubText}>
                      ID: {occ.student_id} · Vào lúc: {new Date(occ.check_in_at).toLocaleTimeString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.quickCheckoutBtn}
                    onPress={() => handleQuickCheckOut(occ.student_id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickCheckoutBtnText}>Cho ra phòng</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          /* TAB 3: Duty Shift History */
          <View style={styles.tabSection}>
            <Text style={styles.tabSectionHeader}>NHẬT KÝ CÁC PHIÊN TRỰC</Text>
            {dutyHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>Chưa có ca trực nào được ghi nhận.</Text>
              </View>
            ) : (
              dutyHistory.slice(0, 20).map((shift) => (
                <View key={shift.id} style={styles.shiftHistoryCard}>
                  <View style={styles.shiftHistoryTop}>
                    <Text style={styles.shiftStaffName}>{shift.duty_staff_name}</Text>
                    <View style={shift.status === "ACTIVE" ? styles.shiftActivePill : styles.shiftCompletedPill}>
                      <Text style={shift.status === "ACTIVE" ? styles.shiftActivePillText : styles.shiftCompletedPillText}>
                        {shift.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.shiftMetaText}>
                    Bắt đầu: {new Date(shift.start_time).toLocaleString()}
                  </Text>
                  <Text style={styles.shiftMetaText}>
                    Kết thúc: {shift.end_time ? new Date(shift.end_time).toLocaleString() : "Đang diễn ra"}
                  </Text>
                  <Text style={styles.shiftDurationText}>
                    Thời lượng: {Math.round((shift.duration_seconds || 0) / 60)} phút
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logoMini: {
    width: 32,
    height: 32,
  },
  roomTagRow: {
    flexDirection: "row",
    gap: 6,
  },
  roomCodeBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#00F0FF",
    letterSpacing: 0.5,
  },
  orgSlugBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  roomNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
    maxWidth: 150,
  },
  topBarRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  changeRoomBtn: {
    backgroundColor: "#131E35",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeRoomBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  superAdminBtn: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  superAdminBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FBBF24",
  },
  personalQRBtn: {
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderWidth: 1,
    borderColor: "#00F0FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  personalQRBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00F0FF",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  // ── HUD Card ──
  hudCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  hudGlowTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#00F0FF",
  },
  hudRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 2,
  },
  statusDotIdle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  statusTextActive: {
    fontSize: 11,
    fontWeight: "900",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  statusTextIdle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: "#131E35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  timerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#38BDF8",
  },
  hudDetailsRow: {
    marginTop: 10,
    marginBottom: 14,
  },
  hudStaffLabel: {
    fontSize: 13,
    color: "#94A3B8",
  },
  hudStaffValue: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  hudTimeLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  startShiftBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  startShiftBtnText: {
    color: "#070B14",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  endShiftBtn: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  endShiftBtnText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  // ── Hero Scan Station ──
  heroScanCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: "#00F0FF",
    shadowColor: "#00F0FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  heroStationTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#00F0FF",
    letterSpacing: 1.5,
  },
  heroStationTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  scannerTypePills: {
    flexDirection: "row",
    backgroundColor: "#131E35",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typePillActive: {
    backgroundColor: "#00F0FF",
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  typePillTextActive: {
    color: "#070B14",
    fontWeight: "900",
  },
  bigScanTrigger: {
    backgroundColor: "rgba(0, 240, 255, 0.05)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(0, 240, 255, 0.4)",
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
  },
  radarRingOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderWidth: 1.5,
    borderColor: "#00F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  radarRingInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00F0FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00F0FF",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  },
  scannerBigIcon: {
    fontSize: 22,
  },
  scanPromptTextContainer: {
    alignItems: "center",
  },
  scanPromptTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#00F0FF",
    letterSpacing: 0.5,
  },
  scanPromptDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  // ── Metrics Row ──
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  metricValueLarge: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  metricValueSub: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginLeft: 4,
  },
  metricBarTrack: {
    height: 4,
    backgroundColor: "#1E293B",
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden",
  },
  metricBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  metricFootnote: {
    fontSize: 10,
    color: "#38BDF8",
    fontWeight: "600",
    marginTop: 6,
  },
  // ── Switch Tabs ──
  switchTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  switchTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  switchTabBtnActive: {
    backgroundColor: "#131E35",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  switchTabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  switchTabBtnTextActive: {
    color: "#00F0FF",
    fontWeight: "800",
  },
  // ── Tab Section Content ──
  tabSection: {
    gap: 12,
  },
  tabSectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginLeft: 4,
  },
  tabLoadingBox: {
    padding: 30,
    alignItems: "center",
    gap: 8,
  },
  tabLoadingText: {
    color: "#64748B",
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  emptyCardText: {
    color: "#64748B",
    fontSize: 13,
  },
  // History Item (Clean vs RED highlight)
  historyItemCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  historyItemInvalid: {
    backgroundColor: "#450A0A",
    borderColor: "#DC2626",
    borderWidth: 2,
  },
  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  historyStudentName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  historyStudentNameInvalid: {
    color: "#FCA5A5",
  },
  historyStudentId: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  validBadgePill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  validBadgePillText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "800",
  },
  invalidBadgePill: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  invalidBadgePillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  historyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  historyMetaText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  historyScannerText: {
    fontSize: 11,
    color: "#38BDF8",
  },
  // Occupants
  occupantItemCard: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  occupantNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  occupantName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  dutyMemberBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dutyMemberBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FBBF24",
  },
  occupantSubText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },
  quickCheckoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickCheckoutBtnText: {
    color: "#FCA5A5",
    fontSize: 11,
    fontWeight: "700",
  },
  // Shifts
  shiftHistoryCard: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    gap: 4,
  },
  shiftHistoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  shiftStaffName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  shiftActivePill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftActivePillText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "800",
  },
  shiftCompletedPill: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftCompletedPillText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  shiftMetaText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  shiftDurationText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8",
    marginTop: 2,
  },
});
