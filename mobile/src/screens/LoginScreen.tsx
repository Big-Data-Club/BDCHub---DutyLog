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
  Image,
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
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ Email/Tài khoản và Mật khẩu");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithCredentials(email.trim(), password);
      onLoginSuccess(user);
    } catch (e: any) {
      setErrorMsg(e.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
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
      setErrorMsg(e.message || "Đăng nhập Google thất bại");
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
        {/* Futuristic Brand Header with Club Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/bdclogo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitlePrefix}>BDC HUB</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>DUTYLOG</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            HỆ THỐNG TRỰC PHÒNG & ĐIỂM DANH HIỆN DIỆN
          </Text>
        </View>

        {/* High-Tech Banking Card */}
        <View style={styles.card}>
          <View style={styles.cardGlowBar} />
          <Text style={styles.cardHeaderTitle}>XÁC THỰC ĐỊNH DANH</Text>
          <Text style={styles.cardHeaderDesc}>
            Vui lòng đăng nhập tài khoản hệ thống để bắt đầu ca trực
          </Text>

          {/* Email / Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TÀI KHOẢN / EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: user@bdc.edu.vn hoặc MSSV"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MẬT KHẨU</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Primary Login Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleCredentialsLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0F172A" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>ĐĂNG NHẬP HỆ THỐNG</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC ĐỊNH DANH QUA OAUTH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google OAuth Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.googleIconBadge}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Đăng nhập với Google OAuth</Text>
          </TouchableOpacity>
        </View>

        {/* High-tech security footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            SECURED BY BDC HUB IDENTITY SERVICE · 256-BIT ENCRYPTION
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 26,
  },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 2,
    borderColor: "#00F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#00F0FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 58,
    height: 58,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitlePrefix: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  brandBadge: {
    backgroundColor: "#00F0FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#070B14",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.25)",
    shadowColor: "#00F0FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    position: "relative",
    overflow: "hidden",
  },
  cardGlowBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#00F0FF",
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 0.5,
  },
  cardHeaderDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#090D16",
    borderWidth: 1.5,
    borderColor: "#1E293B",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: "#F8FAFC",
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#00F0FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#00F0FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#070B14",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1E293B",
  },
  dividerText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  googleButton: {
    backgroundColor: "#131E35",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIconText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#EA4335",
  },
  googleButtonText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "700",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 10,
    padding: 10,
  },
  errorIcon: {
    color: "#EF4444",
    fontSize: 14,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
