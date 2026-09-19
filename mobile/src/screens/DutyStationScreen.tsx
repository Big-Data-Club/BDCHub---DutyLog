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
  resolveDisplayName,
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

export interface ActivityLogItem {
  id: string;
  type: "SHIFT_START" | "SHIFT_END" | "CHECK_IN" | "CHECK_OUT";
  title: string;
  subtitle: string;
  timestamp: string;
  badge: string;
  badgeStyle: "success" | "danger" | "info" | "neutral";
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
  const [activeTab, setActiveTab] = useState<"LOGS" | "OCCUPANTS" | "SHIFTS">("LOGS");

  // Data states
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [presenceHistory, setPresenceHistory] = useState<PresenceHistoryItem[]>([]);
  const [dutyHistory, setDutyHistory] = useState<DutyShiftRecord[]>([]);
  const [activeShift, setActiveShift] = useState<DutyShiftRecord | null>(null);
  const [localActivityLogs, setLocalActivityLogs] = useState<ActivityLogItem[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shiftDurationSeconds, setShiftDurationSeconds] = useState(0);

  const displayName = resolveDisplayName(user.name, user.email);

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

      // Build unified chronological activity log feed
      const logs: ActivityLogItem[] = [];

      // 1. Shift events
      shiftsList.forEach((s) => {
        const sTime = new Date(s.start_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        logs.push({
          id: `shift-start-${s.id}`,
          type: "SHIFT_START",
          title: `${resolveDisplayName(s.duty_staff_name, s.duty_staff_email)} bắt đầu ca trực`,
          subtitle: `Phiên trực trạm ${room.name}`,
          timestamp: sTime,
          badge: "Bắt đầu trực",
          badgeStyle: "success",
        });
        if (s.end_time) {
          const eTime = new Date(s.end_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const mins = Math.round((s.duration_seconds || 0) / 60);
          logs.push({
            id: `shift-end-${s.id}`,
            type: "SHIFT_END",
            title: `${resolveDisplayName(s.duty_staff_name, s.duty_staff_email)} kết thúc ca trực`,
            subtitle: `Thời lượng trực: ${mins} phút`,
            timestamp: eTime,
            badge: "Hoàn tất ca",
            badgeStyle: "neutral",
          });
        }
      });

      // 2. Presence events (check-in / check-out)
      histList.forEach((p) => {
        const inTime = new Date(p.check_in_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        logs.push({
          id: `checkin-${p.id}`,
          type: "CHECK_IN",
          title: `${p.student_name} (${p.student_id})`,
          subtitle: `Quét bởi: ${resolveDisplayName(p.scanner_name)}`,
          timestamp: inTime,
          badge: p.is_valid_member ? "Hợp lệ" : "Ngoài tổ chức",
          badgeStyle: p.is_valid_member ? "success" : "danger",
        });

        if (p.check_out_at) {
          const outTime = new Date(p.check_out_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          logs.push({
            id: `checkout-${p.id}`,
            type: "CHECK_OUT",
            title: `${p.student_name} (${p.student_id}) check-out`,
            subtitle: `Thời gian ở lại: ${Math.round((p.duration_seconds || 0) / 60)} phút`,
            timestamp: outTime,
            badge: "Rời phòng",
            badgeStyle: "neutral",
          });
        }
      });

      setLocalActivityLogs(logs);
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
        name: displayName,
        email: user.email,
      });
      setActiveShift(shift);

      // Immediately append to local activity logs
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newEntry: ActivityLogItem = {
        id: `shift-live-${Date.now()}`,
        type: "SHIFT_START",
        title: `${displayName} bắt đầu ca trực`,
        subtitle: `Phiên trực trạm ${room.name}`,
        timestamp: timeStr,
        badge: "Bắt đầu trực",
        badgeStyle: "success",
      };
      setLocalActivityLogs((prev) => [newEntry, ...prev]);

      await loadStationData();
      Alert.alert("Ca trực đã bắt đầu", `Chào ${displayName}, phiên trực tại ${room.name} đã được ghi nhận lúc ${timeStr}.`);
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

              const now = new Date();
              const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const mins = res.duration_seconds ? Math.round(res.duration_seconds / 60) : 1;
              const endEntry: ActivityLogItem = {
                id: `shift-end-${Date.now()}`,
                type: "SHIFT_END",
                title: `${displayName} kết thúc ca trực`,
                subtitle: `Thời lượng trực: ${mins} phút`,
                timestamp: timeStr,
                badge: "Hoàn tất ca",
                badgeStyle: "neutral",
              };
              setLocalActivityLogs((prev) => [endEntry, ...prev]);

              await loadStationData();
              Alert.alert("Hoàn tất ca trực", `Đã lưu nhật ký ca trực của ${displayName}. Tổng thời gian: ${mins} phút.`);
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
      `Họ và tên: ${displayName}\nEmail: ${user.email}\nVai trò: ${user.roles.join(", ") || "Thành viên"}\nPhòng trực: ${room.name}\n\nTính năng cấu hình tài khoản cá nhân đang trong giai đoạn phát triển, vui lòng thử lại sau.`
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
        {/* ── Minimalist Executive Top Bar ───────────────────────────────── */}
        <View style={styles.topBar}>
          {/* Back button to Room Selection */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToRooms}
            activeOpacity={0.7}
            accessibilityLabel="Quay lại danh sách phòng"
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          {/* Center Info: Building tag, Org, Room name */}
          <View style={styles.topBarCenter}>
            <View style={styles.brandRow}>
              <Text style={styles.buildingTagBadge}>{buildingTag}</Text>
              <Text style={styles.orgSlugBadge}>{organization.slug.toUpperCase()}</Text>
            </View>
            <Text style={styles.roomNameText} numberOfLines={1}>
              {room.name}
            </Text>
          </View>

          {/* Right Actions: QR, Admin, User Initial */}
          <View style={styles.topBarRight}>
            {user.is_super_admin && onNavigateToInspection && (
              <TouchableOpacity
                style={styles.adminBtn}
                onPress={onNavigateToInspection}
                activeOpacity={0.8}
              >
                <Text style={styles.adminBtnText}>Admin</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.personalQRBtn}
              onPress={onOpenPersonalQR}
              activeOpacity={0.8}
            >
              <Text style={styles.personalQRText}>Mã QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userAvatarBtn}
              onPress={handleUserProfilePress}
              activeOpacity={0.8}
            >
              <View style={styles.userAvatarCircle}>
                <Text style={styles.userAvatarText}>
                  {displayName.charAt(0).toUpperCase()}
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
          {/* ── Executive Shift Status HUD ─────────────────────────────────── */}
          <View style={[styles.hudCard, activeShift ? styles.hudCardActive : styles.hudCardIdle]}>
            <View style={styles.hudHeaderRow}>
              <View style={styles.shiftStatusBadge}>
                <View style={activeShift ? styles.statusDotActive : styles.statusDotIdle} />
                <Text style={activeShift ? styles.statusTextActive : styles.statusTextIdle}>
                  {activeShift ? "CA TRỰC HOẠT ĐỘNG" : "CHƯA BẮT ĐẦU CA"}
                </Text>
              </View>

              {activeShift && (
                <View style={styles.timerBadge}>
                  <Text style={styles.timerText}>{formatTimer(shiftDurationSeconds)}</Text>
                </View>
              )}
            </View>

            <View style={styles.hudInfoRow}>
              <View style={styles.hudInfoCol}>
                <Text style={styles.hudLabel}>Nhân sự trực</Text>
                <Text style={styles.hudValue} numberOfLines={1}>
                  {activeShift ? resolveDisplayName(activeShift.duty_staff_name, activeShift.duty_staff_email) : displayName}
                </Text>
              </View>

              {activeShift && (
                <View style={styles.hudInfoColRight}>
                  <Text style={styles.hudLabel}>Bắt đầu</Text>
                  <Text style={styles.hudValue}>
                    {new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
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
                  <Text style={styles.endShiftBtnText}>Kết thúc ca trực</Text>
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
                  <Text style={styles.startShiftBtnText}>Bắt đầu ca trực ngay</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ── Executive Scan Trigger Card ("Bấm vô là quét") ──────────────── */}
          <View style={styles.scanCard}>
            <View style={styles.scanCardHeader}>
              <View>
                <Text style={styles.scanCardTag}>TRẠM ĐIỂM DANH</Text>
                <Text style={styles.scanCardTitle}>Quét thẻ sinh viên</Text>
              </View>

              {/* Minimalist segmented mode switch */}
              <View style={styles.modeSegment}>
                <TouchableOpacity
                  style={[styles.segmentBtn, scanType === "BARCODE" && styles.segmentBtnActive]}
                  onPress={() => setScanType("BARCODE")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, scanType === "BARCODE" && styles.segmentTextActive]}>
                    Mã vạch
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, scanType === "QR_SCAN" && styles.segmentBtnActive]}
                  onPress={() => setScanType("QR_SCAN")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, scanType === "QR_SCAN" && styles.segmentTextActive]}>
                    Mã QR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* High-end scan button */}
            <TouchableOpacity
              style={styles.scanActionBtn}
              onPress={() => onOpenScanner(scanType)}
              activeOpacity={0.88}
            >
              <View style={styles.scanIconBox}>
                <View style={styles.scanCrosshair} />
              </View>
              <View style={styles.scanActionTextCol}>
                <Text style={styles.scanActionTitle}>
                  {scanType === "BARCODE" ? "Mở máy quét mã vạch thẻ" : "Mở máy quét mã QR"}
                </Text>
                <Text style={styles.scanActionSubtitle}>
                  Tự động kiểm tra quyền tổ chức và ghi nhận nhật ký
                </Text>
              </View>
              <Text style={styles.scanChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── Compact Executive Metrics Row ──────────────────────────────── */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>HIỆN DIỆN</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValueBold}>{currentCount}</Text>
                <Text style={styles.metricValueSub}>/ {capacity}</Text>
              </View>
              <View style={styles.metricProgressTrack}>
                <View
                  style={[
                    styles.metricProgressFill,
                    {
                      width: `${occupancyPercent}%`,
                      backgroundColor: occupancyPercent > 85 ? "#DC2626" : "#2563EB",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TỈ LỆ LẤP ĐẦY</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValueBold}>{occupancyPercent}%</Text>
              </View>
              <Text
                style={[
                  styles.metricStatusText,
                  currentCount >= capacity && styles.metricStatusTextWarn,
                ]}
              >
                {currentCount >= capacity ? "Đạt công suất tối đa" : "Phòng hoạt động bình thường"}
              </Text>
            </View>
          </View>

          {/* ── Clean Tab Segmented Control ─────────────────────────────────── */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "LOGS" && styles.tabButtonActive]}
              onPress={() => setActiveTab("LOGS")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === "LOGS" && styles.tabButtonTextActive]}>
                Nhật ký ({localActivityLogs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "OCCUPANTS" && styles.tabButtonActive]}
              onPress={() => setActiveTab("OCCUPANTS")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === "OCCUPANTS" && styles.tabButtonTextActive]}>
                Hiện diện ({currentCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "SHIFTS" && styles.tabButtonActive]}
              onPress={() => setActiveTab("SHIFTS")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === "SHIFTS" && styles.tabButtonTextActive]}>
                Ca trực ({dutyHistory.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Tab Content ─────────────────────────────────────────────────── */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Đang cập nhật nhật ký...</Text>
            </View>
          ) : activeTab === "LOGS" ? (
            /* TAB 1: Unified Activity & Duty Logs */
            <View style={styles.tabSection}>
              {localActivityLogs.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardTitle}>Chưa có ghi nhận hoạt động</Text>
                  <Text style={styles.emptyCardText}>
                    Khi ca trực bắt đầu hoặc sinh viên điểm danh, thông tin sẽ được cập nhật tại đây theo thời gian thực.
                  </Text>
                </View>
              ) : (
                localActivityLogs.slice(0, 40).map((log) => (
                  <View key={log.id} style={styles.logItemCard}>
                    <View style={styles.logItemLeft}>
                      <View
                        style={[
                          styles.logDot,
                          log.badgeStyle === "success" && styles.logDotSuccess,
                          log.badgeStyle === "danger" && styles.logDotDanger,
                          log.badgeStyle === "neutral" && styles.logDotNeutral,
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logTitle}>{log.title}</Text>
                        <Text style={styles.logSubtitle}>{log.subtitle}</Text>
                      </View>
                    </View>

                    <View style={styles.logItemRight}>
                      <View
                        style={[
                          styles.logBadge,
                          log.badgeStyle === "success" && styles.logBadgeSuccess,
                          log.badgeStyle === "danger" && styles.logBadgeDanger,
                          log.badgeStyle === "neutral" && styles.logBadgeNeutral,
                        ]}
                      >
                        <Text
                          style={[
                            styles.logBadgeText,
                            log.badgeStyle === "success" && styles.logBadgeTextSuccess,
                            log.badgeStyle === "danger" && styles.logBadgeTextDanger,
                            log.badgeStyle === "neutral" && styles.logBadgeTextNeutral,
                          ]}
                        >
                          {log.badge}
                        </Text>
                      </View>
                      <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : activeTab === "OCCUPANTS" ? (
            /* TAB 2: Live Room Occupants */
            <View style={styles.tabSection}>
              {occupants.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardTitle}>Phòng hiện đang trống</Text>
                  <Text style={styles.emptyCardText}>
                    Sinh viên điểm danh vào phòng sẽ xuất hiện tại danh sách này.
                  </Text>
                </View>
              ) : (
                occupants.map((occ) => (
                  <View key={occ.student_id} style={styles.occupantCard}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.occupantTitleRow}>
                        <Text style={styles.occupantName}>{occ.student_name}</Text>
                        {occ.is_on_duty && (
                          <View style={styles.dutyBadge}>
                            <Text style={styles.dutyBadgeText}>Trực phòng</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.occupantMeta}>
                        MSSV: {occ.student_id} · Vào lúc: {new Date(occ.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.checkoutActionBtn}
                      onPress={() => handleQuickCheckOut(occ.student_id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.checkoutActionText}>Rời phòng</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ) : (
            /* TAB 3: Shift History */
            <View style={styles.tabSection}>
              {dutyHistory.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardTitle}>Chưa có ca trực hoàn tất</Text>
                  <Text style={styles.emptyCardText}>
                    Nhật ký các phiên trực phòng sẽ hiển thị đầy đủ tại đây.
                  </Text>
                </View>
              ) : (
                dutyHistory.slice(0, 25).map((shift) => (
                  <View key={shift.id} style={styles.shiftCard}>
                    <View style={styles.shiftCardTop}>
                      <Text style={styles.shiftStaffName}>
                        {resolveDisplayName(shift.duty_staff_name, shift.duty_staff_email)}
                      </Text>
                      <View
                        style={
                          shift.status === "ACTIVE"
                            ? styles.shiftStatusPillActive
                            : styles.shiftStatusPillDone
                        }
                      >
                        <Text
                          style={
                            shift.status === "ACTIVE"
                              ? styles.shiftStatusPillTextActive
                              : styles.shiftStatusPillTextDone
                          }
                        >
                          {shift.status === "ACTIVE" ? "Đang trực" : "Hoàn thành"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.shiftMeta}>
                      Bắt đầu: {new Date(shift.start_time).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </Text>
                    {shift.end_time && (
                      <Text style={styles.shiftMeta}>
                        Kết thúc: {new Date(shift.end_time).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </Text>
                    )}
                    <Text style={styles.shiftDuration}>
                      Thời gian trực: {Math.round((shift.duration_seconds || 0) / 60)} phút
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
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  backArrow: {
    fontSize: 24,
    color: "#0F172A",
    fontWeight: "300",
    marginTop: -2,
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
  buildingTagBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orgSlugBadge: {
    fontSize: 10,
    fontWeight: "700",
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
    gap: 6,
  },
  adminBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  adminBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  personalQRBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  personalQRText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  userAvatarBtn: {
    position: "relative",
  },
  userAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
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
    gap: 14,
    paddingBottom: 40,
  },

  // ── Executive Shift HUD Card ─────────────────────────────────────────────
  hudCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  hudCardActive: {
    borderColor: "#A7F3D0",
  },
  hudCardIdle: {
    borderColor: "#E2E8F0",
  },
  hudHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    backgroundColor: "#94A3B8",
  },
  statusTextActive: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.5,
  },
  statusTextIdle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  timerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
    fontVariant: ["tabular-nums"],
  },
  hudInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    marginBottom: 14,
  },
  hudInfoCol: {
    flex: 1,
  },
  hudInfoColRight: {
    alignItems: "flex-end",
  },
  hudLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
  },
  hudValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  startShiftBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  startShiftBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  endShiftBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  endShiftBtnText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Executive Scan Trigger Card ──────────────────────────────────────────
  scanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  scanCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  scanCardTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.8,
  },
  scanCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  modeSegment: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  segmentTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  scanActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  scanIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    justifyContent: "center",
    alignItems: "center",
  },
  scanCrosshair: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: "#2563EB",
    borderRadius: 3,
  },
  scanActionTextCol: {
    flex: 1,
  },
  scanActionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  scanActionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  scanChevron: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "300",
  },

  // ── Metrics Row ──────────────────────────────────────────────────────────
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  metricValueBold: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  metricValueSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginLeft: 3,
  },
  metricProgressTrack: {
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  metricProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  metricStatusText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "600",
    marginTop: 6,
  },
  metricStatusTextWarn: {
    color: "#DC2626",
  },

  // ── Segmented Control Tabs ───────────────────────────────────────────────
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },

  // ── Tab Content ──────────────────────────────────────────────────────────
  tabSection: {
    gap: 8,
  },
  loadingBox: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptyCardText: {
    color: "#64748B",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 260,
  },

  // Activity Log Item
  logItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  logDotSuccess: {
    backgroundColor: "#10B981",
  },
  logDotDanger: {
    backgroundColor: "#EF4444",
  },
  logDotNeutral: {
    backgroundColor: "#94A3B8",
  },
  logTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  logSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  logItemRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  logBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logBadgeSuccess: {
    backgroundColor: "#ECFDF5",
  },
  logBadgeDanger: {
    backgroundColor: "#FEF2F2",
  },
  logBadgeNeutral: {
    backgroundColor: "#F1F5F9",
  },
  logBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  logBadgeTextSuccess: {
    color: "#059669",
  },
  logBadgeTextDanger: {
    color: "#DC2626",
  },
  logBadgeTextNeutral: {
    color: "#64748B",
  },
  logTimestamp: {
    fontSize: 10,
    color: "#94A3B8",
    fontVariant: ["tabular-nums"],
  },

  // Occupant Card
  occupantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  occupantTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  occupantName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  dutyBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dutyBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#B45309",
  },
  occupantMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  checkoutActionBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  checkoutActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },

  // Shift Card
  shiftCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 3,
  },
  shiftCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftStaffName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  shiftStatusPillActive: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shiftStatusPillDone: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shiftStatusPillTextActive: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  shiftStatusPillTextDone: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  shiftMeta: {
    fontSize: 11,
    color: "#64748B",
  },
  shiftDuration: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 1,
  },
});
