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
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Room, QRToken } from "../types";
import { generateQRToken } from "../api/client";

interface Props {
  room: Room;
  onBack: () => void;
}

export const QRDisplayScreen: React.FC<Props> = ({ room, onBack }) => {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [qrToken, setQrToken] = useState<QRToken | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    return () => clearTimers();
  }, []);

  const canGenerate = studentId.trim().length > 0 && studentName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { stopAutoRefresh(); onBack(); }} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Rooms</Text>
        </TouchableOpacity>
        <Text style={styles.roomTitle} numberOfLines={1}>{room.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Identity inputs */}
        {!isActive && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Mã số sinh viên *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2112345"
              placeholderTextColor="#94A3B8"
              value={studentId}
              onChangeText={setStudentId}
              keyboardType="number-pad"
            />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Nguyễn Văn A"
              placeholderTextColor="#94A3B8"
              value={studentName}
              onChangeText={setStudentName}
            />
          </View>
        )}

        {/* QR Display area */}
        <View style={styles.qrArea}>
          {isActive && qrToken ? (
            <View style={styles.qrCard}>
              <View style={styles.qrWrapper}>
                {loading ? (
                  <ActivityIndicator size="large" color="#2563EB" />
                ) : (
                  <QRCode
                    value={qrToken.payload}
                    size={220}
                    backgroundColor="white"
                    color="black"
                  />
                )}
              </View>
              {/* Countdown ring */}
              <View style={styles.countdownRow}>
                <View style={[
                  styles.countdownBadge,
                  countdown <= 3 && styles.countdownUrgent
                ]}>
                  <Text style={[
                    styles.countdownText,
                    countdown <= 3 && styles.countdownTextUrgent
                  ]}>{countdown}s</Text>
                </View>
                <Text style={styles.countdownHint}>Mã tự làm mới sau {countdown} giây</Text>
              </View>
              <Text style={styles.studentInfo}>{studentName} · {studentId}</Text>
            </View>
          ) : isActive && !qrToken && loading ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.hintText}>Đang tạo mã QR...</Text>
            </View>
          ) : !isActive ? (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderIcon}>📱</Text>
              <Text style={styles.hintText}>Điền thông tin và nhấn "Tạo mã QR"</Text>
            </View>
          ) : null}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>✕ {error}</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {!isActive ? (
            <TouchableOpacity
              style={[styles.primaryButton, !canGenerate && styles.buttonDisabled]}
              onPress={startAutoRefresh}
              disabled={!canGenerate}
            >
              <Text style={styles.primaryButtonText}>Tạo mã QR Check-in</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={stopAutoRefresh}
            >
              <Text style={styles.primaryButtonText}>Dừng</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>Cho người trực phòng quét mã này để check-in vào {room.name}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#1E293B",
    borderRadius: 8,
  },
  backButtonText: { color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  roomTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "700", flex: 1 },
  scrollContent: { paddingBottom: 40 },
  inputCard: {
    margin: 16,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
  },
  inputLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 15,
  },
  qrArea: { alignItems: "center", paddingVertical: 20 },
  qrCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: 290,
  },
  qrWrapper: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  countdownBadge: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: "center",
  },
  countdownUrgent: { backgroundColor: "#DC2626" },
  countdownText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  countdownTextUrgent: { color: "#FFFFFF" },
  countdownHint: { color: "#94A3B8", fontSize: 12 },
  studentInfo: { color: "#64748B", fontSize: 12, marginTop: 8 },
  qrPlaceholder: {
    width: 260,
    height: 200,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
  },
  qrPlaceholderIcon: { fontSize: 40 },
  errorBox: {
    marginTop: 12,
    backgroundColor: "#7F1D1D",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
  },
  errorText: { color: "#FCA5A5", fontSize: 13 },
  actions: { paddingHorizontal: 16, marginTop: 8 },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#DC2626",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  hint: { paddingHorizontal: 16, marginTop: 12 },
  hintText: { color: "#64748B", fontSize: 12, textAlign: "center" },
});
