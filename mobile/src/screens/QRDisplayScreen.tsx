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
  Image,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Room, QRToken, User } from "../types";
import { generateQRToken } from "../api/client";

interface Props {
  user?: User;
  room: Room;
  onBack: () => void;
}

export const QRDisplayScreen: React.FC<Props> = ({ user, room, onBack }) => {
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
        <TouchableOpacity
          onPress={() => {
            stopAutoRefresh();
            onBack();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Trạm trực</Text>
        </TouchableOpacity>
        <View style={styles.roomTagRow}>
          <Image
            source={require("../../assets/bdclogo.png")}
            style={styles.logoMini}
            resizeMode="contain"
          />
          <Text style={styles.roomTitle} numberOfLines={1}>
            {room.name}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleCard}>
          <Text style={styles.headerBadge}>DYNAMIC CHECK-IN QR</Text>
          <Text style={styles.pageTitle}>Mã QR Điểm danh Cá nhân</Text>
          <Text style={styles.pageSubtitle}>
            Mã QR tự động đổi token mỗi 10 giây kèm chữ ký HMAC để bảo mật tối đa
          </Text>
        </View>

        {/* Identity Inputs (Editable if needed) */}
        {!isActive && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>MÃ SỐ SINH VIÊN / ID</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2112345"
              placeholderTextColor="#64748B"
              value={studentId}
              onChangeText={setStudentId}
              keyboardType="number-pad"
            />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>HỌ VÀ TÊN</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Nguyễn Văn A"
              placeholderTextColor="#64748B"
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
                  <ActivityIndicator size="large" color="#00F0FF" />
                ) : (
                  <QRCode
                    value={qrToken.payload}
                    size={220}
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
              <ActivityIndicator size="large" color="#00F0FF" />
              <Text style={styles.hintText}>Đang ký số HMAC & tạo mã QR...</Text>
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
  container: { flex: 1, backgroundColor: "#070B14" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#131E35",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  backButtonText: { color: "#38BDF8", fontSize: 12, fontWeight: "700" },
  roomTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  logoMini: {
    width: 20,
    height: 20,
  },
  roomTitle: { color: "#F8FAFC", fontSize: 13, fontWeight: "700", maxWidth: 180 },
  scrollContent: { paddingBottom: 40 },
  titleCard: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#00F0FF",
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  inputCard: {
    margin: 16,
    backgroundColor: "#0F172A",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  inputLabel: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#070B14",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 14,
  },
  qrArea: { alignItems: "center", paddingVertical: 16 },
  qrCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: 290,
    borderWidth: 2,
    borderColor: "rgba(0, 240, 255, 0.4)",
    shadowColor: "#00F0FF",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  qrWrapper: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    elevation: 8,
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  countdownBadge: {
    backgroundColor: "#00F0FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: "center",
  },
  countdownUrgent: { backgroundColor: "#DC2626" },
  countdownText: { color: "#070B14", fontSize: 13, fontWeight: "900" },
  countdownTextUrgent: { color: "#FFFFFF" },
  countdownHint: { color: "#94A3B8", fontSize: 11 },
  studentInfo: { color: "#F8FAFC", fontSize: 12, fontWeight: "700", marginTop: 8 },
  qrPlaceholder: {
    width: 270,
    height: 200,
    backgroundColor: "#0F172A",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: "#1E293B",
    borderStyle: "dashed",
  },
  qrPlaceholderIcon: { fontSize: 36 },
  errorBox: {
    marginTop: 12,
    backgroundColor: "#7F1D1D",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
  },
  errorText: { color: "#FCA5A5", fontSize: 12 },
  actions: { paddingHorizontal: 20, marginTop: 8 },
  primaryButton: {
    backgroundColor: "#00F0FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: "#070B14", fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  dangerButtonText: { color: "#FCA5A5", fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
  hint: { paddingHorizontal: 20, marginTop: 14 },
  hintText: { color: "#64748B", fontSize: 11, textAlign: "center" },
});
