import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { loginWithCredentials, loginWithGoogle } from "../api/client";
import { User } from "../types";

interface Props {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCredentialsLogin = async () => {
    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập Email hoặc Username");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithCredentials(email.trim(), password);
      onLoginSuccess(user);
    } catch (e: any) {
      setErrorMsg(e.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (e: any) {
      setErrorMsg(e.message || "Google OAuth thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleType: "STAFF_SINGLE" | "STAFF_MULTI" | "SUPER_ADMIN") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let targetEmail = "staff@bdc.edu.vn";
      if (roleType === "STAFF_MULTI") {
        targetEmail = "leader.multi@bdc.edu.vn";
      } else if (roleType === "SUPER_ADMIN") {
        targetEmail = "admin.super@bdc.edu.vn";
      }
      const user = await loginWithCredentials(targetEmail, "secret123");
      onLoginSuccess(user);
    } catch (e: any) {
      setErrorMsg(e.message || "Đăng nhập nhanh thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.appBadge}>BDC Hub</Text>
          <Text style={styles.title}>DutyLog</Text>
          <Text style={styles.subtitle}>
            Hệ thống Quản lý Điểm danh & Trực phòng
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Đăng nhập hệ thống</Text>
          <Text style={styles.inputLabel}>Tài khoản / Email sinh viên</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: student@bdc.edu.vn hoặc 2112345"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>✕ {errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleCredentialsLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Đăng nhập mật khẩu</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Đăng nhập với Google OAuth</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Login Selectors for pair programming verification */}
        <View style={styles.quickLoginSection}>
          <Text style={styles.quickLoginHeader}>Trải nghiệm nhanh theo quyền:</Text>
          <View style={styles.quickButtonGroup}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleQuickLogin("STAFF_SINGLE")}
            >
              <Text style={styles.quickButtonText}>Trực phòng (1 Org)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleQuickLogin("STAFF_MULTI")}
            >
              <Text style={styles.quickButtonText}>Đa tổ chức (Multi-Org)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, styles.quickButtonAdmin]}
              onPress={() => handleQuickLogin("SUPER_ADMIN")}
            >
              <Text style={styles.quickButtonAdminText}>Super Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  appBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F8FAFC",
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#334155",
  },
  dividerText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 12,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: "900",
    color: "#EA4335",
  },
  googleButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  errorBox: {
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
  quickLoginSection: {
    marginTop: 24,
    alignItems: "center",
  },
  quickLoginHeader: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 10,
  },
  quickButtonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  quickButton: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickButtonText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  quickButtonAdmin: {
    borderColor: "#F59E0B",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  quickButtonAdminText: {
    color: "#FBBF24",
    fontSize: 11,
    fontWeight: "700",
  },
});
