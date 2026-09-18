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

  const handleGoogleLogin = () => {
    Alert.alert(
      "Thông báo",
      "Tính năng đang trong giai đoạn phát triển, vui lòng thử lại sau"
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Header & Branding Section ──────────────────────────────── */}
          <View style={styles.heroSection}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBrandLeft}>
                <View style={styles.clubLogoRow}>
                  <Image
                    source={require("../../assets/bdclogo.png")}
                    style={styles.brandIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.clubTitleCol}>
                    <Text style={styles.clubMainName}>BIG DATA CLUB</Text>
                    <Text style={styles.clubSubName}>HCMUT</Text>
                  </View>
                </View>

                {/* Main Hero Title */}
                <View style={styles.heroTitleRow}>
                  <Text style={styles.titleBdc}>BDC </Text>
                  <Text style={styles.titleHub}>HUB</Text>
                </View>

                {/* DutyLog Badge */}
                <View style={styles.badgeRow}>
                  <View style={styles.dutyLogPill}>
                    <Text style={styles.dutyLogPillText}>DUTYLOG</Text>
                  </View>
                </View>

                <Text style={styles.taglineText}>
                  KẾT NỐI  ·  HỌC HỎI  ·  PHÁT TRIỂN
                </Text>
              </View>

              {/* 3D Tech Cloud / Server Platform Illustration */}
              <View style={styles.cloudCardGraphic}>
                <View style={styles.cloudCardInner}>
                  <View style={styles.cloudNodeGlow} />
                  <Text style={styles.cloudEmoji}>☁️</Text>
                  <View style={styles.serverPlatformBase}>
                    <View style={styles.serverPlatformTop} />
                    <View style={styles.serverPlatformMid} />
                    <View style={styles.serverPlatformBottom} />
                  </View>
                  <View style={styles.radarPill}>
                    <View style={styles.radarPillDot} />
                    <Text style={styles.radarPillText}>V1.0 LIVE</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── Main Authentication Card ────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>XÁC THỰC ĐỊNH DANH</Text>
              <Text style={styles.cardSubtitle}>
                Vui lòng đăng nhập tài khoản hệ thống để bắt đầu ca trực
              </Text>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Field: Username / Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>👤  TÀI KHOẢN / EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.fieldIcon}>✉️</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="VD: user@bdc.edu.vn hoặc MSSV"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Field: Password with Toggle Eye */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🔒  MẬT KHẨU</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.fieldIcon}>🔑</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "🙈"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary Action Button: Login */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleCredentialsLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContentRow}>
                  <Text style={styles.primaryButtonText}>ĐĂNG NHẬP HỆ THỐNG</Text>
                  <Text style={styles.btnArrow}>→</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC TIẾP TỤC VỚI</Text>
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
              <Text style={styles.googleButtonText}>Đăng nhập với Google OAuth</Text>
            </TouchableOpacity>
          </View>

          {/* ── Partner & Affiliation Logos Section (HCMUT · HPCC · BDC) ─── */}
          <View style={styles.partnersSection}>
            <Text style={styles.partnersTitle}>ĐƠN VỊ HỢP TÁC & PHÁT TRIỂN</Text>

            <View style={styles.logosContainer}>
              {/* 1. HCMUT Logo */}
              <View style={styles.logoItem}>
                <View style={styles.logoItemBadge}>
                  <Image
                    source={require("../../assets/hcmut.png")}
                    style={styles.partnerLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.partnerLogoLabel}>ĐH Bách Khoa</Text>
                <Text style={styles.partnerLogoSub}>HCMUT</Text>
              </View>

              {/* Separator Dot */}
              <View style={styles.logoSeparatorDot} />

              {/* 2. HPCC Logo */}
              <View style={styles.logoItem}>
                <View style={styles.logoItemBadge}>
                  <Image
                    source={require("../../assets/hpcc-logo.png")}
                    style={styles.partnerLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.partnerLogoLabel}>Trung tâm HPCC</Text>
                <Text style={styles.partnerLogoSub}>High Performance</Text>
              </View>

              {/* Separator Dot */}
              <View style={styles.logoSeparatorDot} />

              {/* 3. BDC Logo */}
              <View style={styles.logoItem}>
                <View style={styles.logoItemBadge}>
                  <Image
                    source={require("../../assets/bdclogo.png")}
                    style={styles.partnerLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.partnerLogoLabel}>Big Data Club</Text>
                <Text style={styles.partnerLogoSub}>BDC Hub</Text>
              </View>
            </View>

            {/* Security Guarantee Footnote */}
            <View style={styles.securityFootnote}>
              <Text style={styles.securityFootnoteIcon}>🛡️</Text>
              <Text style={styles.securityFootnoteText}>
                Phiên đăng nhập duy trì an toàn với phần cứng Keystore / Keychain
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 25,
    paddingBottom: 35,
  },

  // ── Hero Section ──────────────────────────────────────────────────────────
  heroSection: {
    marginBottom: 20,
    marginTop: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroBrandLeft: {
    flex: 1,
    paddingRight: 10,
  },
  clubLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  brandIcon: {
    width: 36,
    height: 36,
  },
  clubTitleCol: {
    justifyContent: "center",
  },
  clubMainName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F2B5C",
    letterSpacing: 0.8,
  },
  clubSubName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.5,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  titleBdc: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  titleHub: {
    fontSize: 34,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: -1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dutyLogPill: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dutyLogPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  taglineText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.5,
  },

  // ── 3D Tech Cloud Graphic ─────────────────────────────────────────────────
  cloudCardGraphic: {
    width: 110,
    height: 115,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.15)",
    padding: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cloudCardInner: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  cloudNodeGlow: {
    position: "absolute",
    top: 5,
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  cloudEmoji: {
    fontSize: 34,
    marginBottom: 2,
  },
  serverPlatformBase: {
    width: 70,
    alignItems: "center",
    marginTop: -2,
    marginBottom: 6,
  },
  serverPlatformTop: {
    width: 60,
    height: 6,
    backgroundColor: "#93C5FD",
    borderRadius: 3,
    marginBottom: 2,
  },
  serverPlatformMid: {
    width: 68,
    height: 6,
    backgroundColor: "#60A5FA",
    borderRadius: 3,
    marginBottom: 2,
  },
  serverPlatformBottom: {
    width: 74,
    height: 8,
    backgroundColor: "#2563EB",
    borderRadius: 4,
  },
  radarPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  radarPillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  radarPillText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.5,
  },

  // ── Main Card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.08)",
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 24,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F2B5C",
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 12.5,
    fontWeight: "600",
    lineHeight: 17,
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  fieldIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 18,
  },

  // ── Primary Button ────────────────────────────────────────────────────────
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  btnArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    paddingHorizontal: 12,
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // ── Google Button ─────────────────────────────────────────────────────────
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    height: 50,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIconText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#EA4335",
  },
  googleButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#334155",
  },

  // ── Partners & Logos Section ──────────────────────────────────────────────
  partnersSection: {
    alignItems: "center",
    paddingTop: 4,
  },
  partnersTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  logosContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  logoItem: {
    alignItems: "center",
    flex: 1,
  },
  logoItemBadge: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
    padding: 6,
  },
  partnerLogoImage: {
    width: "100%",
    height: "100%",
  },
  partnerLogoLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
  },
  partnerLogoSub: {
    fontSize: 9.5,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 1,
    textAlign: "center",
  },
  logoSeparatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 4,
    marginBottom: 26,
  },

  // ── Security Footnote ─────────────────────────────────────────────────────
  securityFootnote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 6,
  },
  securityFootnoteIcon: {
    fontSize: 13,
  },
  securityFootnoteText: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "700",
  },
});
