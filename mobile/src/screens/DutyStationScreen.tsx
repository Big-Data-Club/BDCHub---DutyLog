import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
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
      "Xác nhận kết thúc phiên trực hiện tại và lưu trữ dữ liệu?",
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
              Alert.alert("Đã kết thúc ca trực", `Tổng thời gian trực: ${mins} phút. Dữ liệu đã được lưu thành công.`);
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

  const handleUserProfilePress = () => {
    Alert.alert(
      "Tài khoản định danh",
      `Người dùng: ${user.name || user.email}\nVai trò: ${user.roles.join(", ") || "Thành viên"}\nPhòng trực: ${room.name}\n\nTính năng cấu hình tài khoản cá nhân đang trong giai đoạn phát triển, vui lòng thử lại sau.`
    );
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

  const buildingTag = room.building
    ? `TÒA ${room.building.toUpperCase()} · P.${room.room_number || room.id}`
    : `PHÒNG ${room.id}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
        <View style={styles.topBar}>
          {/* Prominent Back Button to return to Room Selection */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToRooms}
            activeOpacity={0.7}
            accessibilityLabel="Quay lại danh sách phòng"
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          {/* Center Info: Logo, Room code/building, Room name */}
          <View style={styles.topBarCenter}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/bdclogo.png")}
                style={styles.miniLogo}
                resizeMode="contain"
              />
              <View style={styles.roomTagRow}>
                <Text style={styles.buildingTagBadge}>{buildingTag}</Text>
                <Text style={styles.orgSlugBadge}>{organization.slug.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.roomNameText} numberOfLines={1}>
              {room.name}
            </Text>
          </View>

          {/* Right Action Icons: Admin, QR, User Avatar */}
          <View style={styles.topBarRight}>
            {user.is_super_admin && onNavigateToInspection && (
              <TouchableOpacity
                style={styles.superAdminBtn}
                onPress={onNavigateToInspection}
                activeOpacity={0.8}
              >
                <Text style={styles.superAdminBtnText}>🛡️</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.personalQRBtn}
              onPress={onOpenPersonalQR}
              activeOpacity={0.8}
            >
              <Text style={styles.personalQRIcon}>📱</Text>
              <Text style={styles.personalQRText}>QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userAvatarBtn}
              onPress={handleUserProfilePress}
              activeOpacity={0.8}
            >
              <View style={styles.userAvatarCircle}>
                <Text style={styles.userAvatarText}>
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userActiveDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Scrollable Body ────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Status HUD / Shift Card ───────────────────────────────────── */}
          <View style={[styles.hudCard, activeShift ? styles.hudCardActive : styles.hudCardIdle]}>
            <View
              style={[
                styles.hudAccentStrip,
                { backgroundColor: activeShift ? "#10B981" : "#CBD5E1" },
              ]}
            />

            <View style={styles.hudHeaderRow}>
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
                Người trực:{" "}
                <Text style={styles.hudStaffValue}>
                  {activeShift?.duty_staff_name || user.name}
                </Text>
              </Text>
              {activeShift ? (
                <Text style={styles.hudTimeLabel}>
                  Bắt đầu: {new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              ) : (
                <Text style={styles.hudSubHint}>
                  Kích hoạt ca trực để quản lý lượt điểm danh và ghi nhận phiên trực.
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
                {actionLoading ? (
                  <ActivityIndicator color="#DC2626" size="small" />
                ) : (
                  <Text style={styles.endShiftBtnText}>⏹ KẾT THÚC CA TRỰC</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.startShiftBtn}
                onPress={handleStartShift}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.startShiftBtnText}>▶ BẮT ĐẦU CA TRỰC NGAY</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ── HERO SCAN STATION ("Bấm vô là quét", High-Tech Banking Style) ── */}
          <View style={styles.heroScanCard}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.heroTitleCol}>
                <View style={styles.heroTagBadge}>
                  <Text style={styles.heroTagBadgeText}>TRẠM ĐIỂM DANH HIỆN DIỆN</Text>
                </View>
                <Text style={styles.heroStationTitle}>Bấm để quét sinh viên</Text>
              </View>

              {/* Scan Type Toggle Pills */}
              <View style={styles.scannerTypePills}>
                <TouchableOpacity
                  style={[styles.typePill, scanType === "BARCODE" && styles.typePillActive]}
                  onPress={() => setScanType("BARCODE")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      scanType === "BARCODE" && styles.typePillTextActive,
                    ]}
                  >
                    🏷️ Barcode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typePill, scanType === "QR_SCAN" && styles.typePillActive]}
                  onPress={() => setScanType("QR_SCAN")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      scanType === "QR_SCAN" && styles.typePillTextActive,
                    ]}
                  >
                    🔳 Mã QR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Central High-Tech Scanner Trigger Button */}
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

          {/* ── High-Tech Metrics Row (Banking style) ──────────────────────── */}
          <View style={styles.metricsRow}>
            {/* Metric 1: Live Occupancy */}
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
                      backgroundColor: occupancyPercent > 80 ? "#EF4444" : "#2563EB",
                    },
                  ]}
                />
              </View>
            </View>

            {/* Metric 2: Capacity Ratio */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TỈ LỆ LẤP ĐẦY</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValueLarge}>{occupancyPercent}%</Text>
              </View>
              <Text
                style={[
                  styles.metricFootnote,
                  currentCount >= capacity && styles.metricFootnoteWarn,
                ]}
              >
                {currentCount >= capacity ? "⚠ Đạt giới hạn sức chứa" : "Phòng đang hoạt động tốt"}
              </Text>
            </View>
          </View>

          {/* ── Quick-Switch Segmented Control ─────────────────────────────── */}
          <View style={styles.switchTabsContainer}>
            <TouchableOpacity
              style={[styles.switchTabBtn, activeTab === "HISTORY" && styles.switchTabBtnActive]}
              onPress={() => setActiveTab("HISTORY")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switchTabBtnText,
                  activeTab === "HISTORY" && styles.switchTabBtnTextActive,
                ]}
              >
                📋 Lịch sử quét
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchTabBtn, activeTab === "OCCUPANTS" && styles.switchTabBtnActive]}
              onPress={() => setActiveTab("OCCUPANTS")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switchTabBtnText,
                  activeTab === "OCCUPANTS" && styles.switchTabBtnTextActive,
                ]}
              >
                👥 Hiện diện ({currentCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchTabBtn, activeTab === "SHIFTS" && styles.switchTabBtnActive]}
              onPress={() => setActiveTab("SHIFTS")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switchTabBtnText,
                  activeTab === "SHIFTS" && styles.switchTabBtnTextActive,
                ]}
              >
                ⏱️ Ca trực
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Tab Content Area ───────────────────────────────────────────── */}
          {loading ? (
            <View style={styles.tabLoadingBox}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.tabLoadingText}>Đang đồng bộ dữ liệu phòng...</Text>
            </View>
          ) : activeTab === "HISTORY" ? (
            /* TAB 1: Check-in / Check-out History with RED Alerts */
            <View style={styles.tabSection}>
              <Text style={styles.tabSectionHeader}>LỊCH SỬ ĐIỂM DANH GẦN ĐÂY</Text>
              {presenceHistory.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyCardTitle}>Chưa có lượt quét nào</Text>
                  <Text style={styles.emptyCardText}>
                    Các lượt quét barcode hoặc mã QR sẽ hiển thị tại đây theo thời gian thực.
                  </Text>
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
                          <Text
                            style={[
                              styles.historyStudentName,
                              isInvalid && styles.historyStudentNameInvalid,
                            ]}
                          >
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
                          🕒 Vào:{" "}
                          <Text style={styles.historyMetaBold}>
                            {new Date(item.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </Text>
                        </Text>
                        {item.check_out_at && (
                          <Text style={styles.historyMetaText}>
                            🚪 Ra:{" "}
                            <Text style={styles.historyMetaBold}>
                              {new Date(item.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Text>
                          </Text>
                        )}
                        <Text style={styles.historyScannerText}>
                          👤 Quét:{" "}
                          <Text style={styles.historyScannerBold}>
                            {item.scanner_name || "Trực phòng"}
                          </Text>
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
              <Text style={styles.tabSectionHeader}>
                SINH VIÊN ĐANG CÓ MẶT TRONG PHÒNG ({currentCount})
              </Text>
              {occupants.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyCardTitle}>Phòng hiện đang trống</Text>
                  <Text style={styles.emptyCardText}>
                    Khi sinh viên quét thẻ vào phòng, thông tin sẽ xuất hiện tại đây.
                  </Text>
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
                        ID: {occ.student_id} · Vào lúc:{" "}
                        {new Date(occ.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <Text style={styles.emptyIcon}>⏱️</Text>
                  <Text style={styles.emptyCardTitle}>Chưa có ca trực nào</Text>
                  <Text style={styles.emptyCardText}>
                    Lịch sử các phiên trực của ban vận hành sẽ được lưu trữ tại đây.
                  </Text>
                </View>
              ) : (
                dutyHistory.slice(0, 20).map((shift) => (
                  <View key={shift.id} style={styles.shiftHistoryCard}>
                    <View style={styles.shiftHistoryTop}>
                      <Text style={styles.shiftStaffName}>{shift.duty_staff_name}</Text>
                      <View
                        style={
                          shift.status === "ACTIVE"
                            ? styles.shiftActivePill
                            : styles.shiftCompletedPill
                        }
                      >
                        <Text
                          style={
                            shift.status === "ACTIVE"
                              ? styles.shiftActivePillText
                              : styles.shiftCompletedPillText
                          }
                        >
                          {shift.status === "ACTIVE" ? "ĐANG TRỰC" : "HOÀN TẤT"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.shiftMetaText}>
                      Bắt đầu: {new Date(shift.start_time).toLocaleString()}
                    </Text>
                    <Text style={styles.shiftMetaText}>
                      Kết thúc:{" "}
                      {shift.end_time
                        ? new Date(shift.end_time).toLocaleString()
                        : "Đang diễn ra"}
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight || 24) + 6 : 4,
  },

  // ── Top Navigation Bar ───────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.8)",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backArrow: {
    fontSize: 26,
    color: "#334155",
    fontWeight: "300",
    marginTop: -4,
  },
  topBarCenter: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  miniLogo: {
    width: 22,
    height: 22,
  },
  roomTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  buildingTagBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orgSlugBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roomNameText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  superAdminBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
  },
  superAdminBtnText: {
    fontSize: 15,
  },
  personalQRBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  personalQRIcon: {
    fontSize: 13,
  },
  personalQRText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },
  userAvatarBtn: {
    position: "relative",
  },
  userAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  userActiveDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  // ── Scroll Content ───────────────────────────────────────────────────────
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },

  // ── Shift HUD Card ───────────────────────────────────────────────────────
  hudCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  hudCardActive: {
    borderColor: "#A7F3D0",
    backgroundColor: "#FFFFFF",
  },
  hudCardIdle: {
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  hudAccentStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  hudHeaderRow: {
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
    color: "#059669",
    letterSpacing: 0.5,
  },
  statusTextIdle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#D97706",
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  timerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
  },
  hudDetailsRow: {
    marginTop: 10,
    marginBottom: 14,
  },
  hudStaffLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  hudStaffValue: {
    color: "#0F172A",
    fontWeight: "700",
  },
  hudTimeLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  hudSubHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  startShiftBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  startShiftBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  endShiftBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  endShiftBtnText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // ── Hero Scan Station ("Bấm vô là quét") ──────────────────────────────────
  heroScanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "rgba(37, 99, 235, 0.2)",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 8,
  },
  heroTitleCol: {
    flex: 1,
  },
  heroTagBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  heroTagBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 1.2,
  },
  heroStationTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  scannerTypePills: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  typePillActive: {
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  typePillTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  bigScanTrigger: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#93C5FD",
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
  },
  radarRingOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#BFDBFE",
    justifyContent: "center",
    alignItems: "center",
  },
  radarRingInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
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
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  scanPromptDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 16,
  },

  // ── Metrics Row ──────────────────────────────────────────────────────────
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  metricValueLarge: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
  },
  metricValueSub: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    marginLeft: 4,
  },
  metricBarTrack: {
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  metricBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  metricFootnote: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "700",
    marginTop: 6,
  },
  metricFootnoteWarn: {
    color: "#DC2626",
  },

  // ── Switch Tabs (Segmented Control) ──────────────────────────────────────
  switchTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  switchTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  switchTabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  switchTabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  switchTabBtnTextActive: {
    color: "#2563EB",
    fontWeight: "900",
  },

  // ── Tab Section Content ──────────────────────────────────────────────────
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyCardText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    maxWidth: 280,
  },

  // History Item (Clean vs RED alert highlight)
  historyItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  historyItemInvalid: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
    borderWidth: 1.5,
  },
  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  historyStudentName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  historyStudentNameInvalid: {
    color: "#991B1B",
  },
  historyStudentId: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  validBadgePill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  validBadgePillText: {
    color: "#059669",
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
    borderTopColor: "rgba(226, 232, 240, 0.8)",
  },
  historyMetaText: {
    fontSize: 11,
    color: "#64748B",
  },
  historyMetaBold: {
    fontWeight: "700",
    color: "#0F172A",
  },
  historyScannerText: {
    fontSize: 11,
    color: "#2563EB",
  },
  historyScannerBold: {
    fontWeight: "700",
  },

  // Occupants
  occupantItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  occupantNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  occupantName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  dutyMemberBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  dutyMemberBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  occupantSubText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },
  quickCheckoutBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickCheckoutBtnText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
  },

  // Shifts
  shiftHistoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    color: "#0F172A",
  },
  shiftActivePill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftActivePillText: {
    color: "#059669",
    fontSize: 10,
    fontWeight: "800",
  },
  shiftCompletedPill: {
    backgroundColor: "#F1F5F9",
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
    color: "#64748B",
  },
  shiftDurationText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 2,
  },
});
