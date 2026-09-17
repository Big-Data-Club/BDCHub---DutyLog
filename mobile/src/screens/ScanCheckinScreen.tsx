import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Room, CheckInResult, CheckOutResult } from "../types";
import { performCheckIn, performCheckOut, performQRCheckin } from "../api/client";

interface Props {
  room: Room;
  onBack: () => void;
  onSuccess: () => void;
}

export const ScanCheckinScreen: React.FC<Props> = ({ room, onBack, onSuccess }) => {
  const [scanMode, setScanMode] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [cameraMode, setCameraMode] = useState<"BARCODE" | "QR_SCAN">("BARCODE");
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
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarcodeScan = ({ type, data }: { type: string; data: string }) => {
    if (scanning) return; // debounce
    setScanning(true);
    setTimeout(() => setScanning(false), 2000); // 2s cooldown
    
    // Detect if it's a QR token payload (has . separator) or regular barcode
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
          setLastResult(`🚨 CẢNH BÁO TRUY CẬP: Sinh viên ${result.student_name} (${result.student_id}) KHÔNG THUỘC TỔ CHỨC NÀY!`);
        } else {
          setIsInvalidMember(false);
          setLastResult(`QR Checked In: ${result.student_name} (${result.student_id}) - Hợp lệ`);
        }
        setManualInput("");
        onSuccess();
      } else {
        setErrorMsg("QR check-out is not supported yet.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process QR scan");
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
          setLastResult(`🚨 CẢNH BÁO TRUY CẬP: Mã số ${result.student_id} KHÔNG THUỘC TỔ CHỨC!`);
        } else {
          setIsInvalidMember(false);
          setLastResult(`Checked In: ${result.student_name} (${result.student_id}) - Hợp lệ`);
        }
      } else {
        const result: CheckOutResult = await performCheckOut(room.id, targetId);
        setIsInvalidMember(false);
        setLastResult(
          `Checked Out: ${result.student_id} (Thời gian: ${Math.round(result.duration_seconds / 60)} phút)`
        );
      }
      setManualInput("");
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process scan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isInvalidMember && styles.containerInvalidAlert]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.roomTitle} numberOfLines={1}>{room.name}</Text>
      </View>

      {/* Red Alert Banner Top (When Invalid Access Scanned) */}
      {isInvalidMember && (
        <View style={styles.topRedAlertBanner}>
          <Text style={styles.topRedAlertIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.topRedAlertTitle}>CẢNH BÁO TRUY CẬP KHÔNG HỢP LỆ</Text>
            <Text style={styles.topRedAlertDesc}>
              Cá nhân vừa quét không phải là thành viên của tổ chức này!
            </Text>
          </View>
        </View>
      )}

      {/* Mode Selector */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, scanMode === "CHECK_IN" && styles.modeButtonActiveCheckIn]}
          onPress={() => setScanMode("CHECK_IN")}
        >
          <Text
            style={[
              styles.modeButtonText,
              scanMode === "CHECK_IN" && styles.modeButtonTextActive,
            ]}
          >
            Check In (Vào phòng)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, scanMode === "CHECK_OUT" && styles.modeButtonActiveCheckOut]}
          onPress={() => setScanMode("CHECK_OUT")}
        >
          <Text
            style={[
              styles.modeButtonText,
              scanMode === "CHECK_OUT" && styles.modeButtonTextActive,
            ]}
          >
            Check Out (Rời phòng)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, cameraMode === "BARCODE" && styles.modeButtonActiveCheckIn]}
          onPress={() => setCameraMode("BARCODE")}
        >
          <Text style={[styles.modeButtonText, cameraMode === "BARCODE" && styles.modeButtonTextActive]}>
            Quét mã vạch (Barcode)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, cameraMode === "QR_SCAN" && styles.modeButtonActiveCheckIn]}
          onPress={() => setCameraMode("QR_SCAN")}
        >
          <Text style={[styles.modeButtonText, cameraMode === "QR_SCAN" && styles.modeButtonTextActive]}>
            Quét mã QR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder */}
      <View style={[styles.scannerViewport, isInvalidMember && styles.viewportInvalid]}>
        {hasPermission === null ? (
          <Text style={styles.scannerPrompt}>Đang yêu cầu quyền camera...</Text>
        ) : hasPermission === false ? (
          <Text style={styles.scannerPrompt}>Không có quyền truy cập camera</Text>
        ) : (
          <BarCodeScanner
            onBarCodeScanned={scanning ? undefined : handleBarcodeScan}
            style={StyleSheet.absoluteFillObject}
            barCodeTypes={
              cameraMode === "BARCODE" 
                ? [BarCodeScanner.Constants.BarCodeType.code128, BarCodeScanner.Constants.BarCodeType.code39, BarCodeScanner.Constants.BarCodeType.ean13] 
                : [BarCodeScanner.Constants.BarCodeType.qr]
            }
          />
        )}
        <View style={[styles.crosshairBox, isInvalidMember && styles.crosshairBoxInvalid]}>
          <Text style={[styles.scannerPrompt, isInvalidMember && styles.scannerPromptInvalid]}>
            {isInvalidMember
              ? "CẢNH BÁO: KHÔNG THUỘC TỔ CHỨC"
              : cameraMode === "BARCODE"
              ? "Căn chỉnh mã vạch thẻ sinh viên vào khung"
              : "Căn chỉnh mã QR sinh viên vào khung"}
          </Text>
        </View>
      </View>

      {/* Manual Code Entry & Result */}
      <View style={styles.bottomSheet}>
        <Text style={styles.inputLabel}>Nhập mã vạch / MSSV thủ công:</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="VD: 2112345"
            placeholderTextColor="#94A3B8"
            value={manualInput}
            onChangeText={setManualInput}
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={() => handleScanOrSubmit()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>

        {lastResult && (
          <View style={isInvalidMember ? styles.invalidAlertBanner : styles.successBanner}>
            <Text style={isInvalidMember ? styles.invalidAlertText : styles.successText}>
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
    backgroundColor: "#0F172A",
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
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#1E293B",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  roomTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  topRedAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  topRedAlertIcon: {
    fontSize: 24,
  },
  topRedAlertTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  topRedAlertDesc: {
    color: "#FEE2E2",
    fontSize: 12,
    fontWeight: "600",
  },
  modeToggle: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modeButtonActiveCheckIn: {
    backgroundColor: "#2563EB",
  },
  modeButtonActiveCheckOut: {
    backgroundColor: "#EA580C",
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  modeButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scannerViewport: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  viewportInvalid: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  crosshairBox: {
    width: 260,
    height: 150,
    borderWidth: 2,
    borderColor: "#38BDF8",
    borderRadius: 16,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    zIndex: 10,
  },
  crosshairBoxInvalid: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 3,
  },
  scannerPrompt: {
    color: "#BAE6FD",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  scannerPromptInvalid: {
    color: "#FCA5A5",
    fontWeight: "800",
  },
  bottomSheet: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#F8FAFC",
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  successBanner: {
    marginTop: 12,
    backgroundColor: "#064E3B",
    borderWidth: 1,
    borderColor: "#059669",
    borderRadius: 10,
    padding: 12,
  },
  successText: {
    color: "#6EE7B7",
    fontSize: 13,
    fontWeight: "700",
  },
  invalidAlertBanner: {
    marginTop: 12,
    backgroundColor: "#7F1D1D",
    borderWidth: 2,
    borderColor: "#EF4444",
    borderRadius: 10,
    padding: 14,
  },
  invalidAlertText: {
    color: "#FEE2E2",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  errorBanner: {
    marginTop: 12,
    backgroundColor: "#450A0A",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "600",
  },
});
