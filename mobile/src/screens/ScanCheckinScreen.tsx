import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Room, CheckInResult, CheckOutResult } from "../types";
import { performCheckIn, performCheckOut, performQRCheckin } from "../api/client";

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
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isInvalidMember, setIsInvalidMember] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarcodeScan = ({ type, data }: { type: string; data: string }) => {
    if (scanning) return; // debounce
    setScanning(true);
    setTimeout(() => setScanning(false), 2000); // 2s cooldown

    // Detect if it's a signed QR token payload (base64url.hmac) or regular barcode
    if (data.includes(".") && data.split(".").length === 2) {
      handleQRSubmit(data);
    } else {
      handleScanOrSubmit(data);
    }
  };

  const handleQRSubmit = async (payload: string) => {
    setLoading(true);
    setErrorMsg(null);
    setLastResult(null);
    setIsInvalidMember(false);

    try {
      if (scanMode === "CHECK_IN") {
        const result = await performQRCheckin(room.id, payload);
        if (!result.is_valid_member) {
          setIsInvalidMember(true);
          setLastResult(
            `🚨 CẢNH BÁO: Sinh viên ${result.student_name} (${result.student_id}) KHÔNG THUỘC TỔ CHỨC NÀY!`
          );
        } else {
          setIsInvalidMember(false);
          setLastResult(
            `✓ QR HỢP LỆ: ${result.student_name} (${result.student_id}) đã check-in thành công`
          );
        }
        setManualInput("");
        onSuccess();
      } else {
        setErrorMsg("QR check-out hiện chưa được hỗ trợ.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Quét QR thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleScanOrSubmit = async (studentIdToProcess?: string) => {
    const targetId = studentIdToProcess || manualInput.trim();
    if (!targetId) return;

    setLoading(true);
    setErrorMsg(null);
    setLastResult(null);
    setIsInvalidMember(false);

    try {
      if (scanMode === "CHECK_IN") {
        const result: CheckInResult = await performCheckIn(room.id, targetId);
        if (!result.is_valid_member) {
          // RED ALERT on duty staff screen
          setIsInvalidMember(true);
          setLastResult(
            `🚨 CẢNH BÁO: Mã số ${result.student_id} KHÔNG THUỘC TỔ CHỨC NÀY!`
          );
        } else {
          setIsInvalidMember(false);
          setLastResult(
            `✓ HỢP LỆ: ${result.student_name} (${result.student_id}) đã vào phòng`
          );
        }
      } else {
        const result: CheckOutResult = await performCheckOut(room.id, targetId);
        setIsInvalidMember(false);
        setLastResult(
          `✓ CHECK OUT: ${result.student_id} (Thời gian ở lại: ${Math.round(
            result.duration_seconds / 60
          )} phút)`
        );
      }
      setManualInput("");
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Xử lý quét thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isInvalidMember && styles.containerInvalidAlert]}
    >
      {/* Top Bar with Room Info & Back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại trạm trực</Text>
        </TouchableOpacity>
        <Text style={styles.roomTitle} numberOfLines={1}>
          {room.name}
        </Text>
      </View>

      {/* Prominent RED Alert Banner when non-member access detected */}
      {isInvalidMember && (
        <View style={styles.topRedAlertBanner}>
          <Text style={styles.topRedAlertIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.topRedAlertTitle}>
              CẢNH BÁO: TRUY CẬP KHÔNG HỢP LỆ
            </Text>
            <Text style={styles.topRedAlertDesc}>
              Cá nhân vừa quét không thuộc tổ chức quản lý phòng trực này!
            </Text>
          </View>
        </View>
      )}

      {/* Mode Selectors */}
      <View style={styles.modeToggleRow}>
        {/* Check In vs Check Out */}
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              scanMode === "CHECK_IN" && styles.toggleBtnActiveCheckIn,
            ]}
            onPress={() => setScanMode("CHECK_IN")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                scanMode === "CHECK_IN" && styles.toggleBtnTextActive,
              ]}
            >
              Vào phòng (In)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              scanMode === "CHECK_OUT" && styles.toggleBtnActiveCheckOut,
            ]}
            onPress={() => setScanMode("CHECK_OUT")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                scanMode === "CHECK_OUT" && styles.toggleBtnTextActive,
              ]}
            >
              Rời phòng (Out)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Barcode vs QR */}
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              cameraMode === "BARCODE" && styles.toggleBtnActiveCyan,
            ]}
            onPress={() => setCameraMode("BARCODE")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                cameraMode === "BARCODE" && styles.toggleBtnTextActiveDark,
              ]}
            >
              🏷️ Barcode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              cameraMode === "QR_SCAN" && styles.toggleBtnActiveCyan,
            ]}
            onPress={() => setCameraMode("QR_SCAN")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                cameraMode === "QR_SCAN" && styles.toggleBtnTextActiveDark,
              ]}
            >
              🔳 Mã QR
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Viewfinder with Cyber HUD Framing */}
      <View
        style={[
          styles.scannerViewport,
          isInvalidMember && styles.viewportInvalid,
        ]}
      >
        {hasPermission === null ? (
          <Text style={styles.scannerPrompt}>Đang kích hoạt camera...</Text>
        ) : hasPermission === false ? (
          <Text style={styles.scannerPrompt}>Không có quyền truy cập camera</Text>
        ) : (
          <BarCodeScanner
            onBarCodeScanned={scanning ? undefined : handleBarcodeScan}
            style={StyleSheet.absoluteFillObject}
            barCodeTypes={
              cameraMode === "BARCODE"
                ? [
                    BarCodeScanner.Constants.BarCodeType.code128,
                    BarCodeScanner.Constants.BarCodeType.code39,
                    BarCodeScanner.Constants.BarCodeType.ean13,
                  ]
                : [BarCodeScanner.Constants.BarCodeType.qr]
            }
          />
        )}

        {/* High-Tech Crosshairs Box */}
        <View
          style={[
            styles.crosshairBox,
            isInvalidMember && styles.crosshairBoxInvalid,
          ]}
        >
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
          <Text
            style={[
              styles.scannerPrompt,
              isInvalidMember && styles.scannerPromptInvalid,
            ]}
          >
            {isInvalidMember
              ? "CẢNH BÁO: KHÔNG THUỘC TỔ CHỨC"
              : cameraMode === "BARCODE"
              ? "Căn mã vạch thẻ sinh viên vào khung"
              : "Căn mã QR sinh viên vào khung"}
          </Text>
        </View>
      </View>

      {/* Manual Code Input & Scan Results Banner */}
      <View style={styles.bottomSheet}>
        <Text style={styles.inputLabel}>NHẬP MSSV THỦ CÔNG (NẾU MÃ MỜ):</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="VD: 2112345"
            placeholderTextColor="#64748B"
            value={manualInput}
            onChangeText={setManualInput}
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={() => handleScanOrSubmit()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#070B14" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>XÁC NHẬN</Text>
            )}
          </TouchableOpacity>
        </View>

        {lastResult && (
          <View
            style={
              isInvalidMember
                ? styles.invalidAlertBanner
                : styles.successBanner
            }
          >
            <Text
              style={
                isInvalidMember
                  ? styles.invalidAlertText
                  : styles.successText
              }
            >
              {lastResult}
            </Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>✕ {errorMsg}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  containerInvalidAlert: {
    borderWidth: 4,
    borderColor: "#DC2626",
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
    backgroundColor: "#131E35",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  backButtonText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "700",
  },
  roomTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  topRedAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  topRedAlertIcon: {
    fontSize: 22,
  },
  topRedAlertTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  topRedAlertDesc: {
    color: "#FEE2E2",
    fontSize: 11,
    fontWeight: "600",
  },
  modeToggleRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleGroup: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleBtnActiveCheckIn: {
    backgroundColor: "#2563EB",
  },
  toggleBtnActiveCheckOut: {
    backgroundColor: "#EA580C",
  },
  toggleBtnActiveCyan: {
    backgroundColor: "#00F0FF",
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  toggleBtnTextActive: {
    color: "#FFFFFF",
  },
  toggleBtnTextActiveDark: {
    color: "#070B14",
    fontWeight: "900",
  },
  scannerViewport: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  viewportInvalid: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
  },
  crosshairBox: {
    width: 270,
    height: 160,
    borderWidth: 1.5,
    borderColor: "#00F0FF",
    borderRadius: 16,
    backgroundColor: "rgba(0, 240, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    position: "relative",
  },
  crosshairBoxInvalid: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 2.5,
  },
  cornerTL: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#00F0FF",
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#00F0FF",
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#00F0FF",
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#00F0FF",
    borderBottomRightRadius: 8,
  },
  scannerPrompt: {
    color: "#BAE6FD",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  scannerPromptInvalid: {
    color: "#FEE2E2",
    fontWeight: "900",
  },
  bottomSheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    borderTopWidth: 1.5,
    borderTopColor: "rgba(56, 189, 248, 0.2)",
  },
  inputLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#070B14",
    borderWidth: 1.5,
    borderColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#00F0FF",
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#070B14",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  successBanner: {
    marginTop: 10,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 10,
    padding: 12,
  },
  successText: {
    color: "#6EE7B7",
    fontSize: 13,
    fontWeight: "700",
  },
  invalidAlertBanner: {
    marginTop: 10,
    backgroundColor: "#7F1D1D",
    borderWidth: 2,
    borderColor: "#EF4444",
    borderRadius: 10,
    padding: 12,
  },
  invalidAlertText: {
    color: "#FEE2E2",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  errorBanner: {
    marginTop: 10,
    backgroundColor: "#450A0A",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "600",
  },
});
