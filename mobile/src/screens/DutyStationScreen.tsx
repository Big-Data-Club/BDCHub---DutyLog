import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
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
  UserProfileDetail,
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
  fetchStudentProfile,
} from "../api/client";
import { UserDetailModal } from "../components/UserDetailModal";

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

export interface UnifiedTimelineEvent {
  id: string;
  type: "SHIFT_START" | "SHIFT_END" | "CHECK_IN" | "CHECK_OUT";
  title: string;
  subtitle: string;
  timeString: string;
  rawTimestamp: number;
  badge: string;
  status: "success" | "danger" | "neutral" | "info";
  studentId?: string;
  studentName?: string;
  isSystemUser?: boolean;
  isValidMember?: boolean;
}

// ── Pure, Reliable Clock Formatter (Guarantees HH:MM:SS, prevents Android Intl bugs like '15:0') ─
function formatClockTime(timestamp: number | string | Date): string {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "--:--:--";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const PAGE_SIZE = 15;

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
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "OCCUPANTS" | "SHIFTS">("TIMELINE");

  // Data states
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [presenceHistory, setPresenceHistory] = useState<PresenceHistoryItem[]>([]);
  const [dutyHistory, setDutyHistory] = useState<DutyShiftRecord[]>([]);
  const [activeShift, setActiveShift] = useState<DutyShiftRecord | null>(null);

  // Dynamic live event logs (inserted instantly on UI actions)
  const [liveEvents, setLiveEvents] = useState<UnifiedTimelineEvent[]>([]);

  // Pagination states
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shiftDurationSeconds, setShiftDurationSeconds] = useState(0);

  // User Profile Detail Modal state
  const [selectedUser, setSelectedUser] = useState<UserProfileDetail | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const handleOpenProfile = async (studentId: string, isSystemUser?: boolean) => {
    if (!isSystemUser) {
      Alert.alert(
        "Chưa có tài khoản",
        `Sinh viên có mã số ${studentId} chưa được tạo tài khoản trên hệ thống.`
      );
      return;
    }
    setActionLoading(true);
    try {
      const profile = await fetchStudentProfile(studentId);
      if (profile) {
        setSelectedUser(profile);
        setDetailModalVisible(true);
      } else {
        Alert.alert(
          "Thông báo",
          `Không tìm thấy dữ liệu chi tiết cho tài khoản MSSV: ${studentId}.`
        );
      }
    } catch (e: any) {
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
    } finally {
      setActionLoading(false);
    }
  };

  const displayName = resolveDisplayName(user.name, user.email);

  useEffect(() => {
    loadStationData(true);
  }, [room.id]);

  // Live timer ticker for active shift
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

  const loadStationData = async (isInitial: boolean = false) => {
    try {
      if (isInitial) setLoading(true);
      const currentOffset = isInitial ? 0 : historyOffset;

      const [shiftRes, occList, histList, shiftsList] = await Promise.all([
        fetchCurrentShift(room.id).catch(() => ({ has_active_shift: false, shift: undefined })),
        fetchOccupancy(room.id).catch(() => []),
        fetchPresenceHistory(room.id, PAGE_SIZE, currentOffset).catch(() => []),
        fetchDutyHistory(room.id, PAGE_SIZE, currentOffset).catch(() => []),
      ]);

      if (shiftRes.has_active_shift && shiftRes.shift) {
        setActiveShift(shiftRes.shift);
      } else {
        setActiveShift(null);
      }

      setOccupants(occList);

      if (isInitial) {
        setPresenceHistory(histList);
        setDutyHistory(shiftsList);
        setHistoryOffset(PAGE_SIZE);
        setHasMoreHistory(histList.length >= PAGE_SIZE || shiftsList.length >= PAGE_SIZE);
      } else {
        setPresenceHistory((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...prev, ...histList.filter((p) => !ids.has(p.id))];
        });
        setDutyHistory((prev) => {
          const ids = new Set(prev.map((s) => s.id));
          return [...prev, ...shiftsList.filter((s) => !ids.has(s.id))];
        });
        setHistoryOffset((prev) => prev + PAGE_SIZE);
        setHasMoreHistory(histList.length >= PAGE_SIZE || shiftsList.length >= PAGE_SIZE);
      }
    } catch (e) {
      console.warn("Failed to load station data:", e);
    } finally {
      if (isInitial) setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreHistory) return;
    setLoadingMore(true);
    await loadStationData(false);
  };

  // ── Unified Chronological Timeline Synthesis (Sorted strictly newest to oldest) ──
  const unifiedTimeline = useMemo(() => {
    const events: UnifiedTimelineEvent[] = [];

    // 1. Shift records
    dutyHistory.forEach((s) => {
      const startMs = new Date(s.start_time).getTime();
      const staffName = resolveDisplayName(s.duty_staff_name, s.duty_staff_email);

      events.push({
        id: `shift-start-${s.id}`,
        type: "SHIFT_START",
        title: `${staffName} bắt đầu ca trực`,
        subtitle: `Phiên trực trạm ${room.name}`,
        timeString: formatClockTime(startMs),
        rawTimestamp: isNaN(startMs) ? Date.now() : startMs,
        badge: "Bắt đầu trực",
        status: "success",
      });

      if (s.end_time) {
        const endMs = new Date(s.end_time).getTime();
        const mins = Math.max(1, Math.round((s.duration_seconds || 0) / 60));
        events.push({
          id: `shift-end-${s.id}`,
          type: "SHIFT_END",
          title: `${staffName} kết thúc ca trực`,
          subtitle: `Thời lượng phiên trực: ${mins} phút`,
          timeString: formatClockTime(endMs),
          rawTimestamp: isNaN(endMs) ? Date.now() : endMs,
          badge: "Hoàn tất ca",
          status: "neutral",
        });
      }
    });

    // 2. Presence records
    presenceHistory.forEach((p) => {
      const inMs = new Date(p.check_in_at).getTime();
      events.push({
        id: `checkin-${p.id}`,
        type: "CHECK_IN",
        title: `${p.student_name} (${p.student_id})`,
        subtitle: `Quét bởi: ${resolveDisplayName(p.scanner_name)}`,
        timeString: formatClockTime(inMs),
        rawTimestamp: isNaN(inMs) ? Date.now() : inMs,
        badge: p.is_valid_member ? "Trong tổ chức" : "Ngoài tổ chức",
        status: p.is_valid_member ? "success" : "danger",
        studentId: p.student_id,
        studentName: p.student_name,
        isSystemUser: p.is_system_user,
        isValidMember: p.is_valid_member,
      });

      if (p.check_out_at) {
        const outMs = new Date(p.check_out_at).getTime();
        const mins = Math.round((p.duration_seconds || 0) / 60);
        events.push({
          id: `checkout-${p.id}`,
          type: "CHECK_OUT",
          title: `${p.student_name} (${p.student_id}) rời phòng`,
          subtitle: `Thời gian lưu trú: ${mins} phút`,
          timeString: formatClockTime(outMs),
          rawTimestamp: isNaN(outMs) ? Date.now() : outMs,
          badge: "Rời phòng",
          status: "neutral",
          studentId: p.student_id,
          studentName: p.student_name,
          isSystemUser: p.is_system_user,
          isValidMember: p.is_valid_member,
        });
      }
    });

    // 3. Merge with live in-session events
    const existingIds = new Set(events.map((e) => e.id));
    const merged = [
      ...liveEvents.filter((e) => !existingIds.has(e.id)),
      ...events,
    ];

    // STRICT CHRONOLOGICAL SORTING: Newest timestamp on top
    merged.sort((a, b) => b.rawTimestamp - a.rawTimestamp);
    return merged;
  }, [dutyHistory, presenceHistory, liveEvents, room.name]);

  const handleStartShift = async () => {
    setActionLoading(true);
    const nowMs = Date.now();
    try {
      const shift = await startDutyShift(room.id, {
        id: String(user.id),
        name: displayName,
        email: user.email,
      });
      setActiveShift(shift);

      // Instantly inject into live events on top of timeline
      const liveEvent: UnifiedTimelineEvent = {
        id: `live-start-${nowMs}`,
        type: "SHIFT_START",
        title: `${displayName} bắt đầu ca trực`,
        subtitle: `Phiên trực trạm ${room.name}`,
        timeString: formatClockTime(nowMs),
        rawTimestamp: nowMs,
        badge: "Bắt đầu trực",
        status: "success",
      };
      setLiveEvents((prev) => [liveEvent, ...prev]);

      await loadStationData(true);
      Alert.alert(
        "Ca trực đã kích hoạt",
        `Chào ${displayName}, phiên trực đã được ghi nhận lúc ${formatClockTime(nowMs)}.`
      );
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể bắt đầu ca trực");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = () => {
    Alert.alert(
      "Kết thúc ca trực",
      "Xác nhận kết thúc phiên trực hiện tại và lưu trữ dữ liệu nhật ký?",
      [
        { text: "Tiếp tục trực", style: "cancel" },
        {
          text: "Kết thúc ngay",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            const nowMs = Date.now();
            try {
              const res = await endDutyShift(room.id);
              setActiveShift(null);

              const mins = res.duration_seconds ? Math.round(res.duration_seconds / 60) : 1;
              const liveEvent: UnifiedTimelineEvent = {
                id: `live-end-${nowMs}`,
                type: "SHIFT_END",
                title: `${displayName} kết thúc ca trực`,
                subtitle: `Thời lượng phiên trực: ${mins} phút`,
                timeString: formatClockTime(nowMs),
                rawTimestamp: nowMs,
                badge: "Hoàn tất ca",
                status: "neutral",
              };
              setLiveEvents((prev) => [liveEvent, ...prev]);

              await loadStationData(true);
              Alert.alert(
                "Hoàn tất ca trực",
                `Đã lưu nhật ký ca trực của ${displayName}. Tổng thời gian: ${mins} phút.`
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

  const handleQuickCheckOut = async (studentId: string) => {
    try {
      await performCheckOut(room.id, studentId);
      loadStationData(true);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể check-out sinh viên");
    }
  };

  const handleUserProfilePress = () => {
    Alert.alert(
      "Tài khoản định danh",
      `Họ và tên: ${displayName}\nEmail: ${user.email}\nVai trò: ${user.roles.join(", ") || "Thành viên"}\nPhòng: ${room.name}\n\nTính năng cấu hình tài khoản đang được phát triển, vui lòng thử lại sau.`
    );
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const currentCount = occupants.length;
  const capacity = room.capacity || 25;
  const occupancyPercent = Math.min(100, Math.round((currentCount / capacity) * 100));

  const buildingTag = room.building
    ? `TÒA ${room.building.toUpperCase()} · P.${room.room_number || room.id}`
    : `PHÒNG ${room.id}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Minimalist Studio Header Bar ───────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToRooms}
            activeOpacity={0.7}
            accessibilityLabel="Quay lại danh sách phòng"
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <View style={styles.brandRow}>
              <Text style={styles.buildingTagBadge}>{buildingTag}</Text>
              <Text style={styles.orgSlugBadge}>{organization.slug.toUpperCase()}</Text>
            </View>
            <Text style={styles.roomNameText} numberOfLines={1}>
              {room.name}
            </Text>
          </View>

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
              style={styles.qrIconBtn}
              onPress={onOpenPersonalQR}
              activeOpacity={0.8}
            >
              <Text style={styles.qrIconText}>Mã QR</Text>
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
          {/* ── 1. Dynamic Shift Command Island ───────────────────────────── */}
          {activeShift ? (
            <View style={styles.activeShiftIsland}>
              <View style={styles.activeShiftLeft}>
                <View style={styles.activeShiftPulseDot} />
                <View style={{ flex: 1 }}>
                  <View style={styles.activeShiftHeaderRow}>
                    <Text style={styles.activeShiftTag}>ĐANG TRONG CA TRỰC</Text>
                    <Text style={styles.activeShiftTimerText}>
                      {formatTimer(shiftDurationSeconds)}
                    </Text>
                  </View>
                  <Text style={styles.activeShiftStaffName} numberOfLines={1}>
                    {resolveDisplayName(activeShift.duty_staff_name, activeShift.duty_staff_email)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.endShiftActionBtn}
                onPress={handleEndShift}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#DC2626" size="small" />
                ) : (
                  <Text style={styles.endShiftActionText}>Kết thúc ca</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.idleShiftIsland}>
              <View style={styles.idleShiftInfoCol}>
                <Text style={styles.idleShiftSubtitle}>Sẵn sàng nhận phòng</Text>
                <Text style={styles.idleShiftStaffText}>{displayName}</Text>
              </View>

              <TouchableOpacity
                style={styles.startShiftPrimaryBtn}
                onPress={handleStartShift}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.startShiftPrimaryText}>Bắt đầu ca trực</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── 2. Scan Ribbon ("Bấm vô là quét", Fluid Trigger) ──────────── */}
          <View style={styles.scanRibbon}>
            <View style={styles.scanRibbonHeader}>
              <Text style={styles.scanRibbonLabel}>TRẠM ĐIỂM DANH</Text>
              <View style={styles.modePillsGroup}>
                <TouchableOpacity
                  style={[styles.modePillBtn, scanType === "BARCODE" && styles.modePillBtnActive]}
                  onPress={() => setScanType("BARCODE")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.modePillText, scanType === "BARCODE" && styles.modePillTextActive]}
                  >
                    Mã vạch
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modePillBtn, scanType === "QR_SCAN" && styles.modePillBtnActive]}
                  onPress={() => setScanType("QR_SCAN")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.modePillText, scanType === "QR_SCAN" && styles.modePillTextActive]}
                  >
                    Mã QR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tactile Camera Launch Strip */}
            <TouchableOpacity
              style={styles.scanLaunchStrip}
              onPress={() => onOpenScanner(scanType)}
              activeOpacity={0.88}
            >
              <View style={styles.scanLensGlyph}>
                <View style={styles.scanLensInner} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scanLaunchTitle}>
                  {scanType === "BARCODE" ? "Chạm để mở camera quét mã vạch" : "Chạm để mở camera quét mã QR"}
                </Text>
                <Text style={styles.scanLaunchSub}>
                  Tự động kiểm tra quyền tổ chức và ghi nhận tức thì
                </Text>
              </View>
              <Text style={styles.scanLaunchChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── 3. Glanceable Telemetry Bar (No bulky cards) ──────────────── */}
          <View style={styles.telemetryBar}>
            <View style={styles.telemetryTextRow}>
              <Text style={styles.telemetryMainText}>
                <Text style={styles.telemetryNumber}>{currentCount}</Text>
                <Text style={styles.telemetrySub}> / {capacity} có mặt</Text>
              </Text>
              <Text style={styles.telemetryPercentText}>
                {occupancyPercent}% công suất · {currentCount >= capacity ? "Đã lấp đầy" : "Bình thường"}
              </Text>
            </View>
            <View style={styles.telemetryProgressTrack}>
              <View
                style={[
                  styles.telemetryProgressFill,
                  {
                    width: `${occupancyPercent}%`,
                    backgroundColor: occupancyPercent > 85 ? "#DC2626" : "#2563EB",
                  },
                ]}
              />
            </View>
          </View>

          {/* ── 4. Unified Tab Selector ────────────────────────────────────── */}
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabSelectorBtn, activeTab === "TIMELINE" && styles.tabSelectorBtnActive]}
              onPress={() => setActiveTab("TIMELINE")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabSelectorText,
                  activeTab === "TIMELINE" && styles.tabSelectorTextActive,
                ]}
              >
                Nhật ký ({unifiedTimeline.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabSelectorBtn, activeTab === "OCCUPANTS" && styles.tabSelectorBtnActive]}
              onPress={() => setActiveTab("OCCUPANTS")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabSelectorText,
                  activeTab === "OCCUPANTS" && styles.tabSelectorTextActive,
                ]}
              >
                Hiện diện ({currentCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabSelectorBtn, activeTab === "SHIFTS" && styles.tabSelectorBtnActive]}
              onPress={() => setActiveTab("SHIFTS")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabSelectorText,
                  activeTab === "SHIFTS" && styles.tabSelectorTextActive,
                ]}
              >
                Ca trực ({dutyHistory.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 5. Connected Timeline Stream (Creative human design) ───────── */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Đang đồng bộ dòng sự kiện...</Text>
            </View>
          ) : activeTab === "TIMELINE" ? (
            <View style={styles.timelineContainer}>
              {unifiedTimeline.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>Chưa có hoạt động</Text>
                  <Text style={styles.emptyStateText}>
                    Khi ca trực bắt đầu hoặc sinh viên điểm danh, các mốc sự kiện sẽ hiển thị tại đây theo thứ tự thời gian chuẩn.
                  </Text>
                </View>
              ) : (
                <View style={styles.timelineStream}>
                  {/* Spine connecting all nodes */}
                  <View style={styles.timelineSpine} />

                  {unifiedTimeline.map((item, index) => {
                    const isLast = index === unifiedTimeline.length - 1;
                    const isCheckIn = item.type === "CHECK_IN";
                    const isClickable = isCheckIn && !!item.studentId;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.timelineNodeRow, isLast && { paddingBottom: 0 }]}
                        onPress={() => {
                          if (item.studentId) {
                            handleOpenProfile(item.studentId, item.isSystemUser);
                          }
                        }}
                        disabled={!isClickable}
                        activeOpacity={0.7}
                      >
                        {/* Node Bullet */}
                        <View
                          style={[
                            styles.timelineBullet,
                            item.status === "success" && styles.timelineBulletSuccess,
                            item.status === "danger" && styles.timelineBulletDanger,
                            item.status === "neutral" && styles.timelineBulletNeutral,
                          ]}
                        />

                        {/* Node Content */}
                        <View style={styles.timelineNodeContent}>
                          <View style={styles.timelineMainRow}>
                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Text style={styles.timelineItemTitle} numberOfLines={1}>
                                {item.title}
                              </Text>
                              {isClickable && item.isSystemUser && (
                                <Text style={styles.detailCaretText}>Chi tiết ›</Text>
                              )}
                            </View>
                            <Text style={styles.timelineItemClock}>{item.timeString}</Text>
                          </View>

                          <View style={styles.timelineMetaRow}>
                            <Text style={styles.timelineItemSubtitle} numberOfLines={1}>
                              {item.subtitle}
                            </Text>

                            {isCheckIn ? (
                              <View style={styles.tagsContainer}>
                                {/* Tag 1: Tài khoản hệ thống */}
                                <View
                                  style={[
                                    styles.pillTag,
                                    item.isSystemUser ? styles.pillTagSystemActive : styles.pillTagSystemNone,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.pillTagText,
                                      item.isSystemUser ? styles.pillTagTextSystemActive : styles.pillTagTextSystemNone,
                                    ]}
                                  >
                                    {item.isSystemUser ? "Có tài khoản" : "Chưa có tài khoản"}
                                  </Text>
                                </View>

                                {/* Tag 2: Tổ chức */}
                                <View
                                  style={[
                                    styles.pillTag,
                                    item.isValidMember ? styles.pillTagOrgMember : styles.pillTagOrgNonMember,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.pillTagText,
                                      item.isValidMember ? styles.pillTagTextOrgMember : styles.pillTagTextOrgNonMember,
                                    ]}
                                  >
                                    {item.isValidMember ? "Trong tổ chức" : "Ngoài tổ chức"}
                                  </Text>
                                </View>
                              </View>
                            ) : (
                              <View
                                style={[
                                  styles.timelineBadge,
                                  item.status === "success" && styles.timelineBadgeSuccess,
                                  item.status === "danger" && styles.timelineBadgeDanger,
                                  item.status === "neutral" && styles.timelineBadgeNeutral,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.timelineBadgeText,
                                    item.status === "success" && styles.timelineBadgeTextSuccess,
                                    item.status === "danger" && styles.timelineBadgeTextDanger,
                                    item.status === "neutral" && styles.timelineBadgeTextNeutral,
                                  ]}
                                >
                                  {item.badge}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Lazy load / Pagination button */}
                  {hasMoreHistory && (
                    <TouchableOpacity
                      style={styles.loadMoreBtn}
                      onPress={handleLoadMore}
                      disabled={loadingMore}
                      activeOpacity={0.8}
                    >
                      {loadingMore ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                      ) : (
                        <Text style={styles.loadMoreText}>Tải thêm sự kiện cũ hơn ↓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ) : activeTab === "OCCUPANTS" ? (
            /* TAB 2: Live Room Occupants */
            <View style={styles.listContainer}>
              {occupants.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>Phòng hiện đang trống</Text>
                  <Text style={styles.emptyStateText}>
                    Sinh viên điểm danh vào phòng sẽ xuất hiện tại danh sách này.
                  </Text>
                </View>
              ) : (
                occupants.map((occ) => (
                  <View key={occ.student_id} style={styles.occupantRow}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => handleOpenProfile(occ.student_id, occ.is_system_user)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.occupantHeader}>
                        <Text style={styles.occupantTitle}>{occ.student_name}</Text>
                        {occ.is_on_duty && (
                          <View style={styles.dutyTag}>
                            <Text style={styles.dutyTagText}>Trực phòng</Text>
                          </View>
                        )}
                        {occ.is_system_user && (
                          <Text style={styles.occupantDetailLink}>Xem hồ sơ ›</Text>
                        )}
                      </View>

                      {/* 2 Tags: Hệ thống & Tổ chức */}
                      <View style={styles.occupantTagsRow}>
                        <View
                          style={[
                            styles.pillTag,
                            occ.is_system_user ? styles.pillTagSystemActive : styles.pillTagSystemNone,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillTagText,
                              occ.is_system_user ? styles.pillTagTextSystemActive : styles.pillTagTextSystemNone,
                            ]}
                          >
                            {occ.is_system_user ? "Có tài khoản" : "Chưa có tài khoản"}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.pillTag,
                            occ.is_valid_member ? styles.pillTagOrgMember : styles.pillTagOrgNonMember,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillTagText,
                              occ.is_valid_member ? styles.pillTagTextOrgMember : styles.pillTagTextOrgNonMember,
                            ]}
                          >
                            {occ.is_valid_member ? "Trong tổ chức" : "Ngoài tổ chức"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.occupantSubtitle}>
                        MSSV: {occ.student_id} · Vào lúc {formatClockTime(occ.check_in_at)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkoutBtn}
                      onPress={() => handleQuickCheckOut(occ.student_id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.checkoutBtnText}>Rời phòng</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ) : (
            /* TAB 3: Shift History */
            <View style={styles.listContainer}>
              {dutyHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>Chưa có ca trực nào</Text>
                  <Text style={styles.emptyStateText}>
                    Nhật ký các phiên trực phòng sẽ hiển thị đầy đủ tại đây.
                  </Text>
                </View>
              ) : (
                dutyHistory.map((shift) => (
                  <View key={shift.id} style={styles.shiftHistoryRow}>
                    <View style={styles.shiftHeader}>
                      <Text style={styles.shiftStaffTitle}>
                        {resolveDisplayName(shift.duty_staff_name, shift.duty_staff_email)}
                      </Text>
                      <View
                        style={
                          shift.status === "ACTIVE"
                            ? styles.shiftActiveChip
                            : styles.shiftDoneChip
                        }
                      >
                        <Text
                          style={
                            shift.status === "ACTIVE"
                              ? styles.shiftActiveChipText
                              : styles.shiftDoneChipText
                          }
                        >
                          {shift.status === "ACTIVE" ? "Đang trực" : "Hoàn tất"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.shiftTimeRange}>
                      Bắt đầu: {formatClockTime(shift.start_time)}
                      {shift.end_time ? ` · Kết thúc: ${formatClockTime(shift.end_time)}` : ""}
                    </Text>
                    <Text style={styles.shiftDurationNotice}>
                      Thời lượng: {Math.max(1, Math.round((shift.duration_seconds || 0) / 60))} phút
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Full Student Profile Card Modal (Web Parity) ────────────────── */}
        <UserDetailModal
          visible={detailModalVisible}
          user={selectedUser}
          onClose={() => setDetailModalVisible(false)}
        />
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

  // ── Top Bar ───────────────────────────────────────────────────────────────
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  },
  adminBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  qrIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  qrIconText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  userAvatarBtn: {
    position: "relative",
  },
  userAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  // ── Content ───────────────────────────────────────────────────────────────
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  // ── 1. Dynamic Shift Command Island ───────────────────────────────────────
  activeShiftIsland: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    padding: 14,
  },
  activeShiftLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  activeShiftPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
  },
  activeShiftHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeShiftTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.5,
  },
  activeShiftTimerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#047857",
    fontVariant: ["tabular-nums"],
  },
  activeShiftStaffName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065F46",
    marginTop: 2,
  },
  endShiftActionBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  endShiftActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },

  idleShiftIsland: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 14,
  },
  idleShiftInfoCol: {
    flex: 1,
  },
  idleShiftSubtitle: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  idleShiftStaffText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  startShiftPrimaryBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  startShiftPrimaryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── 2. Scan Ribbon ────────────────────────────────────────────────────────
  scanRibbon: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  scanRibbonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  scanRibbonLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.8,
  },
  modePillsGroup: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    padding: 2,
  },
  modePillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  modePillBtnActive: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
  },
  modePillText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  modePillTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  scanLaunchStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  scanLensGlyph: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  scanLensInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#2563EB",
  },
  scanLaunchTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  scanLaunchSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  scanLaunchChevron: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "300",
  },

  // ── 3. Glanceable Telemetry Bar ───────────────────────────────────────────
  telemetryBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  telemetryTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  telemetryMainText: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  telemetryNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  telemetrySub: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  telemetryPercentText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  telemetryProgressTrack: {
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    overflow: "hidden",
  },
  telemetryProgressFill: {
    height: "100%",
    borderRadius: 2,
  },

  // ── 4. Unified Tab Selector ───────────────────────────────────────────────
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 3,
    gap: 3,
    marginTop: 4,
  },
  tabSelectorBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: "center",
  },
  tabSelectorBtnActive: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
  },
  tabSelectorText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  tabSelectorTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },

  // ── 5. Connected Timeline Stream ──────────────────────────────────────────
  timelineContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timelineStream: {
    position: "relative",
  },
  timelineSpine: {
    position: "absolute",
    left: 4,
    top: 6,
    bottom: 24,
    width: 2,
    backgroundColor: "#E2E8F0",
  },
  timelineNodeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 18,
    position: "relative",
  },
  timelineBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#94A3B8",
    marginTop: 3,
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  timelineBulletSuccess: {
    backgroundColor: "#10B981",
  },
  timelineBulletDanger: {
    backgroundColor: "#EF4444",
  },
  timelineBulletNeutral: {
    backgroundColor: "#94A3B8",
  },
  timelineNodeContent: {
    flex: 1,
    gap: 2,
  },
  timelineMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  timelineItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  timelineItemClock: {
    fontSize: 11,
    color: "#64748B",
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  timelineMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  timelineItemSubtitle: {
    fontSize: 11,
    color: "#64748B",
    flex: 1,
    marginRight: 8,
  },
  timelineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineBadgeSuccess: {
    backgroundColor: "#ECFDF5",
  },
  timelineBadgeDanger: {
    backgroundColor: "#FEF2F2",
  },
  timelineBadgeNeutral: {
    backgroundColor: "#F1F5F9",
  },
  timelineBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timelineBadgeTextSuccess: {
    color: "#059669",
  },
  timelineBadgeTextDanger: {
    color: "#DC2626",
  },
  timelineBadgeTextNeutral: {
    color: "#64748B",
  },
  detailCaretText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  occupantTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 3,
  },
  occupantDetailLink: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    marginLeft: 4,
  },
  pillTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  pillTagText: {
    fontSize: 9,
    fontWeight: "700",
  },
  pillTagSystemActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  pillTagTextSystemActive: {
    color: "#1D4ED8",
  },
  pillTagSystemNone: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  pillTagTextSystemNone: {
    color: "#64748B",
  },
  pillTagOrgMember: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  pillTagTextOrgMember: {
    color: "#047857",
  },
  pillTagOrgNonMember: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  pillTagTextOrgNonMember: {
    color: "#B45309",
  },
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  loadMoreText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "700",
  },

  // ── Occupants & Shifts Lists ──────────────────────────────────────────────
  listContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  occupantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  occupantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  occupantTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  dutyTag: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  dutyTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#B45309",
  },
  occupantSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  checkoutBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkoutBtnText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "700",
  },
  shiftHistoryRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 2,
  },
  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftStaffTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  shiftActiveChip: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shiftDoneChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shiftActiveChipText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "700",
  },
  shiftDoneChipText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  shiftTimeRange: {
    fontSize: 11,
    color: "#64748B",
  },
  shiftDurationNotice: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "700",
  },

  // ── States ────────────────────────────────────────────────────────────────
  loadingBox: {
    padding: 30,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
  },
});
