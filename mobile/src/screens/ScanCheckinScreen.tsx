import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  StatusBar as RNStatusBar,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Room, CheckInResult, CheckOutResult, UserProfileDetail } from "../types";
import {
  performCheckIn,
  performCheckOut,
  performQRCheckin,
  resolveDisplayName,
  fetchStudentProfile,
} from "../api/client";
import { UserDetailModal } from "../components/UserDetailModal";

interface Props {
  room: Room;
  initialMode?: "BARCODE" | "QR_SCAN";
  onBack: () => void;
  onSuccess: () => void;
}

export const ScanCheckinScreen: React.FC<Props> = ({
  room,
  initialMode = "BARCODE",
  onBack,
  onSuccess,
}) => {
  const [scanMode, setScanMode] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [cameraMode, setCameraMode] = useState<"BARCODE" | "QR_SCAN">(initialMode);
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    type: "SUCCESS" | "WARNING" | "ERROR";
    title: string;
    message: string;
    studentId?: string;
    studentName?: string;
    isValidMember?: boolean;
    isSystemUser?: boolean;
  } | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);

  // Profile modal states
  const [selectedUser, setSelectedUser] = useState<UserProfileDetail | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Anti-duplicate scan lock: stores { code, time }
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Auto-dismiss last scan result banner after 6 seconds
  useEffect(() => {
    if (!lastResult) return;
    const timer = setTimeout(() => {
      setLastResult(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [lastResult]);

  const handleOpenProfile = async (studentId: string) => {
    if (!studentId) return;
    setLoadingProfile(true);
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
      setLoadingProfile(false);
    }
  };

  const handleBarcodeScan = ({ data }: { type: string; data: string }) => {
    const trimmed = (data || "").trim();
    if (!trimmed) return;
    const now = Date.now();

    // Prevent duplicate rescanning of the exact same code within 12 seconds
    if (
      lastScanRef.current &&
      lastScanRef.current.code === trimmed &&
      now - lastScanRef.current.time < 12000
    ) {
      return;
    }

    if (scanning) return; // debounce active scan cycle
    setScanning(true);
    lastScanRef.current = { code: trimmed, time: now };
    setTimeout(() => setScanning(false), 2500);

    // Detect if it's a signed QR token payload or regular barcode
    if (trimmed.includes(".") && trimmed.split(".").length === 2) {
      handleQRSubmit(trimmed);
    } else {
      handleScanOrSubmit(trimmed);
    }
  };

  const handleQRSubmit = async (payload: string) => {
    setLoading(true);
    setLastResult(null);

    try {
      if (scanMode === "CHECK_IN") {
        const result = await performQRCheckin(room.id, payload);
        const sName = result.student_name || (result.student_id ? `MSSV: ${result.student_id}` : "Sinh viên");
        const sId = result.student_id || "";
        const title = result.is_valid_member ? "Điểm danh hợp lệ" : "Ngoài tổ chức";
        const message = result.alert_message || `${sName} (${sId}) đã ghi nhận vào phòng`;

        setLastResult({
          type: result.is_valid_member ? "SUCCESS" : "WARNING",
          title,
          message,
          studentId: sId,
          studentName: sName,
          isValidMember: result.is_valid_member,
          isSystemUser: result.is_system_user,
        });
        setManualInput("");
        onSuccess();
      } else {
        setLastResult({
          type: "WARNING",
          title: "Chưa hỗ trợ",
          message: "Check-out qua QR cá nhân hiện chưa áp dụng.",
        });
      }
    } catch (err: any) {
      setLastResult({
        type: "ERROR",
        title: "Lỗi xử lý",
        message: err.message || "Quét mã QR thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanOrSubmit = async (studentIdToProcess?: string) => {
    const rawId = (studentIdToProcess || manualInput).trim();
    if (!rawId) return;

    setLoading(true);
    setLastResult(null);

    try {
      if (scanMode === "CHECK_IN") {
        const result: CheckInResult = await performCheckIn(room.id, rawId);
        const sName = result.student_name || (result.student_id ? `MSSV: ${result.student_id}` : "Sinh viên");
        const sId = result.student_id || rawId;
        const title = result.is_valid_member ? "Điểm danh hợp lệ" : "Ngoài tổ chức";
        const message = result.alert_message || `${sName} (${sId}) đã ghi nhận vào phòng`;

        setLastResult({
          type: result.is_valid_member ? "SUCCESS" : "WARNING",
          title,
          message,
          studentId: sId,
          studentName: sName,
          isValidMember: result.is_valid_member,
          isSystemUser: result.is_system_user,
        });
      } else {
        const result: CheckOutResult = await performCheckOut(room.id, rawId);
        setLastResult({
          type: "SUCCESS",
          title: "Check-out thành công",
          message: `Sinh viên ${result.student_id || rawId} đã rời phòng (Thời gian: ${Math.round(
            (result.duration_seconds || 1800) / 60
          )} phút)`,
        });
      }
      setManualInput("");
      onSuccess();
    } catch (err: any) {
      setLastResult({
        type: "ERROR",
        title: "Lỗi xử lý",
        message: err.message || "Xử lý quét thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Minimalist Executive Header ─────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityLabel="Quay lại trạm trực"
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTag}>MÁY QUÉT ĐIỂM DANH</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {room.name}
            </Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {/* ── Result Feedback Banner ───────────────────────────────────────── */}
        {lastResult && (
          <View
            style={[
              styles.feedbackBanner,
              lastResult.type === "SUCCESS" && styles.feedbackSuccess,
              lastResult.type === "WARNING" && styles.feedbackWarning,
              lastResult.type === "ERROR" && styles.feedbackError,
            ]}
          >
            <View style={styles.feedbackContent}>
              <View style={styles.feedbackHeaderRow}>
                <Text
                  style={[
                    styles.feedbackTitle,
                    lastResult.type === "SUCCESS" && styles.feedbackTextSuccess,
                    lastResult.type === "WARNING" && styles.feedbackTextWarning,
                    lastResult.type === "ERROR" && styles.feedbackTextError,
                  ]}
                >
                  {lastResult.title || (lastResult.type === "SUCCESS" ? "Check-in thành công" : "Thông báo")}
                </Text>
                <TouchableOpacity
                  onPress={() => setLastResult(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.feedbackCloseBtn}
                >
                  <Text style={styles.feedbackCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.feedbackDesc,
                  lastResult.type === "SUCCESS" && styles.feedbackDescSuccess,
                  lastResult.type === "WARNING" && styles.feedbackDescWarning,
                  lastResult.type === "ERROR" && styles.feedbackDescError,
                ]}
              >
                {lastResult.message || "Đã xử lý thông tin quét"}
              </Text>

              {/* ── 2 Tags: System User & Organization Membership ────────── */}
              {(lastResult.isSystemUser !== undefined || lastResult.isValidMember !== undefined) && (
                <View style={styles.feedbackTagsRow}>
                  {/* Tag 1: Hệ thống */}
                  <View
                    style={[
                      styles.tagBadge,
                      lastResult.isSystemUser ? styles.tagBadgeSystemActive : styles.tagBadgeSystemNone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagBadgeText,
                        lastResult.isSystemUser ? styles.tagBadgeTextSystemActive : styles.tagBadgeTextSystemNone,
                      ]}
                    >
                      {lastResult.isSystemUser ? "✓ Đã có tài khoản" : "✕ Chưa có tài khoản"}
                    </Text>
                  </View>

                  {/* Tag 2: Tổ chức */}
                  <View
                    style={[
                      styles.tagBadge,
                      lastResult.isValidMember ? styles.tagBadgeOrgMember : styles.tagBadgeOrgNonMember,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagBadgeText,
                        lastResult.isValidMember ? styles.tagBadgeTextOrgMember : styles.tagBadgeTextOrgNonMember,
                      ]}
                    >
                      {lastResult.isValidMember ? "✓ Trong tổ chức" : "⚠ Ngoài tổ chức"}
                    </Text>
                  </View>
                </View>
              )}

              {/* View Profile Action (Only if user exists on system) */}
              {lastResult.isSystemUser && lastResult.studentId && (
                <TouchableOpacity
                  style={styles.viewDetailBtn}
                  onPress={() => handleOpenProfile(lastResult.studentId!)}
                  disabled={loadingProfile}
                  activeOpacity={0.7}
                >
                  {loadingProfile ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <Text style={styles.viewDetailBtnText}>Xem chi tiết người dùng ›</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Mode Segment Controls ────────────────────────────────────────── */}
        <View style={styles.controlsRow}>
          {/* Direction: In vs Out */}
          <View style={styles.segmentGroup}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                scanMode === "CHECK_IN" && styles.segmentBtnActivePrimary,
              ]}
              onPress={() => setScanMode("CHECK_IN")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  scanMode === "CHECK_IN" && styles.segmentTextActiveWhite,
                ]}
              >
                Vào phòng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                scanMode === "CHECK_OUT" && styles.segmentBtnActiveWarn,
              ]}
              onPress={() => setScanMode("CHECK_OUT")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  scanMode === "CHECK_OUT" && styles.segmentTextActiveWhite,
                ]}
              >
                Rời phòng
              </Text>
            </TouchableOpacity>
          </View>

          {/* Type: Barcode vs QR */}
          <View style={styles.segmentGroup}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                cameraMode === "BARCODE" && styles.segmentBtnActiveDark,
              ]}
              onPress={() => setCameraMode("BARCODE")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  cameraMode === "BARCODE" && styles.segmentTextActiveWhite,
                ]}
              >
                Mã vạch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                cameraMode === "QR_SCAN" && styles.segmentBtnActiveDark,
              ]}
              onPress={() => setCameraMode("QR_SCAN")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  cameraMode === "QR_SCAN" && styles.segmentTextActiveWhite,
                ]}
              >
                Mã QR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Camera Viewfinder (Executive Business Class) ─────────────────── */}
        <View style={styles.viewportContainer}>
          {hasPermission === null ? (
            <View style={styles.cameraPlaceholder}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.placeholderText}>Đang kích hoạt camera...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.placeholderTitle}>Không có quyền camera</Text>
              <Text style={styles.placeholderText}>Vui lòng cấp quyền truy cập camera để quét mã thẻ.</Text>
            </View>
          ) : (
            <View style={styles.cameraFrame}>
              <BarCodeScanner
                onBarCodeScanned={scanning ? undefined : handleBarcodeScan}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Minimalist Corner Reticle Overlay */}
              <View style={styles.reticleOverlay}>
                <View style={styles.reticleBox}>
                  {/* Four Corner Brackets */}
                  <View style={[styles.cornerBracket, styles.topLeft]} />
                  <View style={[styles.cornerBracket, styles.topRight]} />
                  <View style={[styles.cornerBracket, styles.bottomLeft]} />
                  <View style={[styles.cornerBracket, styles.bottomRight]} />

                  {loading && (
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.reticleSpinner} />
                  )}
                </View>
                <Text style={styles.reticlePrompt}>
                  {cameraMode === "BARCODE"
                    ? "Căn mã vạch thẻ sinh viên vào khung"
                    : "Căn mã QR điểm danh vào khung"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Manual MSSV Entry Card ──────────────────────────────────────── */}
        <View style={styles.manualCard}>
          <Text style={styles.manualCardLabel}>Nhập MSSV thủ công (nếu mã thẻ mờ)</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập MSSV..."
              placeholderTextColor="#94A3B8"
              value={manualInput}
              onChangeText={setManualInput}
              keyboardType="number-pad"
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!manualInput.trim() || loading) && styles.submitBtnDisabled,
              ]}
              onPress={() => handleScanOrSubmit()}
              disabled={!manualInput.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

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

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },

  // ── Feedback Banner ──────────────────────────────────────────────────────
  feedbackBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  feedbackContent: {
    width: "100%",
  },
  feedbackHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedbackCloseBtn: {
    padding: 2,
    marginLeft: 8,
  },
  feedbackCloseBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  feedbackSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  feedbackWarning: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  feedbackError: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FFE4E6",
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  feedbackTextSuccess: {
    color: "#065F46",
  },
  feedbackTextWarning: {
    color: "#991B1B",
  },
  feedbackTextError: {
    color: "#BE123C",
  },
  feedbackDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  feedbackDescSuccess: {
    color: "#047857",
  },
  feedbackDescWarning: {
    color: "#B91C1C",
  },
  feedbackDescError: {
    color: "#9F1239",
  },
  feedbackTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  tagBadgeSystemActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  tagBadgeTextSystemActive: {
    color: "#1D4ED8",
  },
  tagBadgeSystemNone: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  tagBadgeTextSystemNone: {
    color: "#64748B",
  },
  tagBadgeOrgMember: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  tagBadgeTextOrgMember: {
    color: "#047857",
  },
  tagBadgeOrgNonMember: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  tagBadgeTextOrgNonMember: {
    color: "#B45309",
  },
  viewDetailBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  viewDetailBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },

  // ── Controls Row ─────────────────────────────────────────────────────────
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  segmentGroup: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: "center",
  },
  segmentBtnActivePrimary: {
    backgroundColor: "#2563EB",
  },
  segmentBtnActiveWarn: {
    backgroundColor: "#EA580C",
  },
  segmentBtnActiveDark: {
    backgroundColor: "#0F172A",
  },
  segmentText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  segmentTextActiveWhite: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // ── Viewport Container ───────────────────────────────────────────────────
  viewportContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  placeholderText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  cameraFrame: {
    flex: 1,
    position: "relative",
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  reticleBox: {
    width: 250,
    height: 160,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  cornerBracket: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#FFFFFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  reticleSpinner: {
    position: "absolute",
  },
  reticlePrompt: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 20,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },

  // ── Manual Entry Card ────────────────────────────────────────────────────
  manualCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  manualCardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  manualInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#93C5FD",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
