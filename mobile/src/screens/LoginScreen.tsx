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
  StatusBar as RNStatusBar,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { loginWithCredentials } from "../api/client";
import { User } from "../types";

interface Props {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCredentialsLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập Email / MSSV và Mật khẩu");
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

  const handleGoogleLogin = () => {
    Alert.alert(
      "Thông báo",
      "Tính năng đang trong giai đoạn phát triển, vui lòng thử lại sau"
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Centered Minimalist Header ───────────────────────────────── */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/bdclogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.orgSubtitle}>BIG DATA CLUB · HCMUT</Text>
            <View style={styles.brandRow}>
              <Text style={styles.titleBdc}>BDC </Text>
              <Text style={styles.titleHub}>HUB</Text>
              <View style={styles.dutyPill}>
                <Text style={styles.dutyPillText}>DUTYLOG</Text>
              </View>
            </View>
          </View>

          {/* ── Main Login Card ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>
            <Text style={styles.cardSubtitle}>
              Nhập tài khoản hệ thống để bắt đầu ca trực
            </Text>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Input: Email / MSSV */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tài khoản / Email / MSSV</Text>
              <TextInput
                style={styles.textInput}
                placeholder="user@bdc.edu.vn hoặc MSSV"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Input: Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Mật khẩu</Text>
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.togglePasswordText}>
                    {showPassword ? "Ẩn" : "Hiện"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Primary Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleCredentialsLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Subtle Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google OAuth Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.85}
            >
              <View style={styles.googleIconBadge}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
            </TouchableOpacity>
          </View>

          {/* ── Compact Mini Partner Logos ───────────────────────────────── */}
          <View style={styles.footerPartners}>
            <Text style={styles.footerLabel}>HỆ THỐNG TRỰC THUỘC</Text>
            <View style={styles.miniLogosRow}>
              <Image
                source={require("../../assets/hcmut.png")}
                style={styles.miniLogoHcmut}
                resizeMode="contain"
              />
              <View style={styles.miniLogoDivider} />
              <Image
                source={require("../../assets/hpcc-logo.png")}
                style={styles.miniLogoHpcc}
                resizeMode="contain"
              />
              <View style={styles.miniLogoDivider} />
              <Image
                source={require("../../assets/bdclogo.png")}
                style={styles.miniLogoBdc}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.footerSubtext}>
              ĐH Bách Khoa · HPCC · Big Data Club
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight || 24) + 16 : 14,
    paddingBottom: 24,
    minHeight: "100%",
    justifyContent: "center",
  },

  // ── Centered Header ───────────────────────────────────────────────────────
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 52,
    height: 52,
    marginBottom: 10,
  },
  orgSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  titleBdc: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  titleHub: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: -0.5,
  },
  dutyPill: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginLeft: 8,
  },
  dutyPillText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },

  // ── Main Card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },

  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12.5,
    fontWeight: "600",
    lineHeight: 16,
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  togglePasswordText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: "#0F172A",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },

  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    height: 46,
    gap: 8,
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIconText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#EA4335",
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  // ── Compact Mini Logos Footer ─────────────────────────────────────────────
  footerPartners: {
    alignItems: "center",
  },
  footerLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 10,
  },
  miniLogosRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 6,
  },
  miniLogoHcmut: {
    width: 24,
    height: 24,
    opacity: 0.85,
  },
  miniLogoHpcc: {
    width: 44,
    height: 20,
    opacity: 0.85,
  },
  miniLogoBdc: {
    width: 24,
    height: 24,
    opacity: 0.85,
  },
  miniLogoDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
  },
  footerSubtext: {
    fontSize: 10.5,
    color: "#94A3B8",
    fontWeight: "600",
  },
});
