import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Room, QRToken, User } from "../types";
import { generateQRToken } from "../api/client";
import { HeaderBack } from "../ui/Kit";
import { palette, spacing } from "../ui/theme";

interface Props {
  user?: User;
  room: Room;
  onBack: () => void;
}

export const QRDisplayScreen: React.FC<Props> = ({ user, room, onBack }) => {
  const { width } = useWindowDimensions();
  const qrSize = Math.min(220, Math.max(96, width - 104));
  const [studentId, setStudentId] = useState(user ? String(user.id) : "");
  const [studentName, setStudentName] = useState(user?.name || "");
  const [qrToken, setQrToken] = useState<QRToken | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  const fetchQR = async () => {
    if (!studentId.trim() || !studentName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const token = await generateQRToken(studentId.trim(), studentName.trim());
      setQrToken(token);
      setCountdown(10);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    clearTimers();
    fetchQR();
    // Refresh every 9 seconds
    refreshTimerRef.current = setInterval(fetchQR, 9000);
    // Countdown every second
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 10 : prev - 1));
    }, 1000);
    setIsActive(true);
  };

  const stopAutoRefresh = () => {
    clearTimers();
    setIsActive(false);
    setQrToken(null);
    setCountdown(10);
  };

  useEffect(() => {
    if (user && studentId && studentName) {
      startAutoRefresh();
    }
    return () => clearTimers();
  }, []);

  const canGenerate = studentId.trim().length > 0 && studentName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <HeaderBack
          title="Mã QR cá nhân"
          eyebrow="ĐIỂM DANH"
          onBack={() => { stopAutoRefresh(); onBack(); }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleCard}>
          <Text style={styles.pageTitle}>{room.name}</Text>
          <Text style={styles.pageSubtitle}>
            Mã được làm mới tự động. Đưa mã cho người trực phòng để ghi nhận.
          </Text>
        </View>

        {/* Identity Inputs (Editable if needed) */}
        {!isActive && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>MÃ SỐ SINH VIÊN / ID</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2112345"
              placeholderTextColor={palette.muted}
              value={studentId}
              onChangeText={setStudentId}
              keyboardType="number-pad"
            />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>HỌ VÀ TÊN</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Nguyễn Văn A"
              placeholderTextColor={palette.muted}
              value={studentName}
              onChangeText={setStudentName}
            />
          </View>
        )}

        {/* High-Tech QR Display Area */}
        <View style={styles.qrArea}>
          {isActive && qrToken ? (
            <View style={styles.qrCard}>
              <View style={styles.qrWrapper}>
                {loading ? (
                  <ActivityIndicator size="large" color={palette.blue} />
                ) : (
                  <QRCode
                    value={qrToken.payload}
                    size={qrSize}
                    backgroundColor="white"
                    color="black"
                  />
                )}
              </View>

              {/* Countdown Gauge */}
              <View style={styles.countdownRow}>
                <View
                  style={[
                    styles.countdownBadge,
                    countdown <= 3 && styles.countdownUrgent,
                  ]}
                >
                  <Text
                    style={[
                      styles.countdownText,
                      countdown <= 3 && styles.countdownTextUrgent,
                    ]}
                  >
                    {countdown}s
                  </Text>
                </View>
                <Text style={styles.countdownHint}>
                  Mã tự động đổi sau {countdown} giây
                </Text>
              </View>
              <Text style={styles.studentInfo}>
                {studentName} · MSSV: {studentId}
              </Text>
            </View>
          ) : isActive && !qrToken && loading ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color={palette.blue} />
              <Text style={styles.hintText}>Đang tạo mã QR…</Text>
            </View>
          ) : !isActive ? (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderIcon}>📱</Text>
              <Text style={styles.hintText}>
                Bấm "Tạo mã QR Check-in" để bắt đầu phát mã
              </Text>
            </View>
          ) : null}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>✕ {error}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isActive ? (
            <TouchableOpacity
              style={[styles.primaryButton, !canGenerate && styles.buttonDisabled]}
              onPress={startAutoRefresh}
              disabled={!canGenerate}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>TẠO MÃ QR CHECK-IN</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={stopAutoRefresh}
              activeOpacity={0.85}
            >
              <Text style={styles.dangerButtonText}>DỪNG PHÁT MÃ</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Đưa mã này cho trực phòng quét để check-in vào phòng {room.name}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  header: { paddingHorizontal: spacing.page, paddingTop: 16, backgroundColor: palette.white, borderBottomWidth: 1, borderBottomColor: palette.line },
  scrollContent: { paddingBottom: 32 },
  titleCard: { paddingHorizontal: spacing.page, paddingTop: 20, paddingBottom: 8 },
  pageTitle: { fontSize: 20, fontWeight: "800", color: palette.ink },
  pageSubtitle: { fontSize: 14, lineHeight: 21, color: palette.muted, marginTop: 8 },
  inputCard: { margin: 16, backgroundColor: palette.white, borderRadius: spacing.radius, padding: spacing.card, borderWidth: 1, borderColor: palette.line },
  inputLabel: { color: palette.muted, fontSize: 11, fontWeight: "700", marginBottom: 6 },
  input: { backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.line, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: palette.ink, fontSize: 14 },
  qrArea: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 },
  qrCard: { backgroundColor: palette.white, borderRadius: spacing.radius, padding: spacing.card, alignItems: "center", width: "100%", maxWidth: 330, borderWidth: 1, borderColor: palette.line },
  qrWrapper: { backgroundColor: palette.white, borderRadius: 12, padding: 16 },
  countdownRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 },
  countdownBadge: { backgroundColor: palette.blueWash, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, minWidth: 44, alignItems: "center" },
  countdownUrgent: { backgroundColor: palette.redWash },
  countdownText: { color: palette.blue, fontSize: 14, fontWeight: "700" },
  countdownTextUrgent: { color: palette.red },
  countdownHint: { color: palette.muted, fontSize: 12 },
  studentInfo: { color: palette.ink, fontSize: 14, fontWeight: "600", marginTop: 12, textAlign: "center" },
  qrPlaceholder: { width: "100%", maxWidth: 330, minHeight: 200, padding: 20, backgroundColor: palette.white, borderRadius: spacing.radius, alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: palette.line, borderStyle: "dashed" },
  qrPlaceholderIcon: { fontSize: 36 },
  errorBox: { marginTop: 12, backgroundColor: palette.redWash, borderRadius: 10, padding: 12, width: "100%" },
  errorText: { color: palette.red, fontSize: 14 },
  actions: { paddingHorizontal: spacing.page, marginTop: 8 },
  primaryButton: { backgroundColor: palette.blue, borderRadius: 14, paddingVertical: 14, alignItems: "center", minHeight: 48 },
  dangerButton: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 14, paddingVertical: 14, alignItems: "center", minHeight: 48 },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: palette.white, fontSize: 14, fontWeight: "700" },
  dangerButtonText: { color: palette.red, fontSize: 14, fontWeight: "700" },
  hint: { paddingHorizontal: spacing.page, marginTop: 14 },
  hintText: { color: palette.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
});
