import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { UserProfileDetail } from "../types";

interface Props {
  visible: boolean;
  user: UserProfileDetail | null;
  onClose: () => void;
}

function displayRole(role?: string): string {
  if (!role) return "Thành viên";
  const map: Record<string, string> = {
    ROLE_ADMIN: "Admin",
    ROLE_MANAGER: "Manager",
    ROLE_USER: "Thành viên",
    ROLE_MEMBER: "Thành viên",
    ROLE_ALUMNI: "Cựu sinh viên",
    ADMIN: "Admin",
    MANAGER: "Manager",
    MEMBER: "Thành viên",
  };
  return map[role.toUpperCase()] || role;
}

function getRoleBadgeStyle(role?: string) {
  const r = (role || "").toUpperCase();
  if (r.includes("ADMIN")) {
    return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
  }
  if (r.includes("MANAGER")) {
    return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
  }
  if (r.includes("ALUMNI")) {
    return { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" };
  }
  return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
}

export const UserDetailModal: React.FC<Props> = ({ visible, user, onClose }) => {
  if (!user) return null;

  const roleStyle = getRoleBadgeStyle(user.role);
  const isActive = user.status !== false;

  const formattedDate = user.dateAdded
    ? new Date(user.dateAdded).toLocaleDateString("vi-VN")
    : "Chưa xác định";

  const orgsDisplay =
    user.organizations && user.organizations.length > 0
      ? user.organizations.join(", ")
      : user.organization || "Chưa tham gia";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.cardContainer}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Đóng modal"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* ── Header Profile Card ────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.avatarWrapper}>
              {user.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {/* Status dot */}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? "#10B981" : "#94A3B8" },
                ]}
              />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                ✉ {user.email || "Chưa có email"}
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: roleStyle.bg,
                      borderColor: roleStyle.border,
                    },
                  ]}
                >
                  <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
                    🛡 {displayRole(user.role)}
                  </Text>
                </View>
                <Text style={styles.badgeSeparator}>•</Text>
                <Text
                  style={[
                    styles.activeText,
                    { color: isActive ? "#059669" : "#64748B" },
                  ]}
                >
                  {isActive ? "Đang hoạt động" : "Tạm khóa"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Body: Info Grid (Matching Web DetailModal) ─────── */}
          <ScrollView
            style={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyContent}
          >
            <View style={styles.grid}>
              {/* MSSV / Code */}
              <View style={styles.gridTile}>
                <View style={styles.tileIconBox}>
                  <Text style={styles.tileIconGlyph}>#</Text>
                </View>
                <View style={styles.tileMeta}>
                  <Text style={styles.tileLabel}>MSSV / MÃ SỐ</Text>
                  <Text style={styles.tileValue} numberOfLines={1}>
                    {user.code || "Chưa có"}
                  </Text>
                </View>
              </View>

              {/* Team */}
              <View style={styles.gridTile}>
                <View style={styles.tileIconBox}>
                  <Text style={styles.tileIconGlyph}>👥</Text>
                </View>
                <View style={styles.tileMeta}>
                  <Text style={styles.tileLabel}>TEAM</Text>
                  <Text style={styles.tileValue} numberOfLines={1}>
                    {user.team || "Chưa phân team"}
                  </Text>
                </View>
              </View>

              {/* Loại / Type */}
              <View style={styles.gridTile}>
                <View style={styles.tileIconBox}>
                  <Text style={styles.tileIconGlyph}>🎓</Text>
                </View>
                <View style={styles.tileMeta}>
                  <Text style={styles.tileLabel}>PHÂN LOẠI</Text>
                  <Text style={styles.tileValue} numberOfLines={1}>
                    {user.type || "Thành viên"}
                  </Text>
                </View>
              </View>

              {/* Điểm / Score */}
              <View style={[styles.gridTile, styles.gridTileHighlight]}>
                <View style={[styles.tileIconBox, styles.tileIconBoxHighlight]}>
                  <Text style={[styles.tileIconGlyph, { color: "#2563EB" }]}>★</Text>
                </View>
                <View style={styles.tileMeta}>
                  <Text style={styles.tileLabel}>ĐIỂM TÍCH LŨY</Text>
                  <Text style={[styles.tileValue, styles.tileValueHighlight]}>
                    {user.score ?? 0}
                  </Text>
                </View>
              </View>

              {/* Ngày thêm */}
              <View style={styles.gridTile}>
                <View style={styles.tileIconBox}>
                  <Text style={styles.tileIconGlyph}>📅</Text>
                </View>
                <View style={styles.tileMeta}>
                  <Text style={styles.tileLabel}>NGÀY THAM GIA</Text>
                  <Text style={styles.tileValue} numberOfLines={1}>
                    {formattedDate}
                  </Text>
                </View>
              </View>

              {/* Trạng thái */}
              <View style={styles.gridTile}>
                <View style={styles.tileIconBox}>
                  <Text style={styles.tileIconGlyph}>⚡</Text>
                </View>
                <View style={styles.tileMeta}>
                  <Text style={styles.tileLabel}>TRẠNG THÁI</Text>
                  <Text
                    style={[
                      styles.tileValue,
                      { color: isActive ? "#059669" : "#64748B" },
                    ]}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tổ chức / Organizations (Full width) */}
            <View style={styles.orgFullTile}>
              <View style={styles.tileIconBox}>
                <Text style={styles.tileIconGlyph}>🏢</Text>
              </View>
              <View style={styles.tileMeta}>
                <Text style={styles.tileLabel}>TỔ CHỨC THÀNH VIÊN</Text>
                <Text style={styles.tileValue}>{orgsDisplay}</Text>
              </View>
            </View>
          </ScrollView>

          {/* ── Footer ─────────────────────────────────────────── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.dismissBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: "85%",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingRight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
    gap: 14,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  statusDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeSeparator: {
    fontSize: 12,
    color: "#CBD5E1",
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bodyScroll: {
    maxHeight: 380,
  },
  bodyContent: {
    padding: 16,
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridTile: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 8,
  },
  gridTileHighlight: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  tileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tileIconBoxHighlight: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  tileIconGlyph: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "700",
  },
  tileMeta: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  tileValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 1,
  },
  tileValueHighlight: {
    color: "#2563EB",
    fontWeight: "800",
  },
  orgFullTile: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 10,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
    alignItems: "flex-end",
  },
  dismissBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
  },
  dismissBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
