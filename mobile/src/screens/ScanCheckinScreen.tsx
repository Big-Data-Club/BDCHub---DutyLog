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
      // QR mode: call checkin-qr
      handleQRSubmit(data);
    } else {
      // Barcode mode: call regular checkin with student_id=data
      handleScanOrSubmit(data);
    }
  };

  const handleQRSubmit = async (payload: string) => {
    setLoading(true);
    setErrorMsg(null);
    setLastResult(null);

    try {
      if (scanMode === "CHECK_IN") {
        const result = await performQRCheckin(room.id, payload);
        setLastResult(`QR Checked In: ${result.student_name} (${result.student_id})`);
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

    try {
      if (scanMode === "CHECK_IN") {
        const result: CheckInResult = await performCheckIn(room.id, targetId);
        setLastResult(`Checked In: ${result.student_name} (${result.student_id})`);
      } else {
        const result: CheckOutResult = await performCheckOut(room.id, targetId);
        setLastResult(
          `Checked Out: ${result.student_id} (Duration: ${Math.round(result.duration_seconds / 60)}m)`
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Rooms</Text>
        </TouchableOpacity>
        <Text style={styles.roomTitle}>{room.name}</Text>
      </View>

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
            Check In
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
            Check Out
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, cameraMode === "BARCODE" && styles.modeButtonActiveCheckIn]}
          onPress={() => setCameraMode("BARCODE")}
        >
          <Text style={[styles.modeButtonText, cameraMode === "BARCODE" && styles.modeButtonTextActive]}>
            Barcode Mode
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, cameraMode === "QR_SCAN" && styles.modeButtonActiveCheckIn]}
          onPress={() => setCameraMode("QR_SCAN")}
        >
          <Text style={[styles.modeButtonText, cameraMode === "QR_SCAN" && styles.modeButtonTextActive]}>
            QR Mode
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.scannerViewport}>
        {hasPermission === null ? (
          <Text style={styles.scannerPrompt}>Requesting camera permission...</Text>
        ) : hasPermission === false ? (
          <Text style={styles.scannerPrompt}>No access to camera</Text>
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
        <View style={styles.crosshairBox}>
          <Text style={styles.scannerPrompt}>
            {cameraMode === "BARCODE" ? "Align student card barcode inside this frame" : "Align student QR code inside this frame"}
          </Text>
        </View>
      </View>

      {/* Manual Code Entry & Simulation */}
      <View style={styles.bottomSheet}>
        <Text style={styles.inputLabel}>Manual Barcode / Student ID</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Scan or enter ID (for example 2112345)"
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
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>

        {lastResult && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {lastResult}</Text>
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
  modeToggle: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
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
    backgroundColor: "#DC2626",
  },
  modeButtonText: {
    fontSize: 14,
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
  scannerPrompt: {
    color: "#BAE6FD",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
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
    borderRadius: 8,
    padding: 10,
  },
  successText: {
    color: "#6EE7B7",
    fontSize: 13,
    fontWeight: "600",
  },
  errorBanner: {
    marginTop: 12,
    backgroundColor: "#7F1D1D",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "600",
  },
});
