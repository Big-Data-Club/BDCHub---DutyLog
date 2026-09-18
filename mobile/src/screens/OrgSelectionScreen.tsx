import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
} from "react-native";
import { Organization, User } from "../types";

interface Props {
  user: User;
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
  onLogout: () => void;
  onNavigateToInspection?: () => void;
}

type FilterType = "ALL" | "HAS_ROOMS" | "MANAGED" | "MEMBER";

export const OrgSelectionScreen: React.FC<Props> = ({
  user,
  organizations,
  onSelectOrg,
  onLogout,
  onNavigateToInspection,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("ALL");

  const handleUserProfilePress = () => {
    Alert.alert(
      "Tài khoản định danh",
      `Người dùng: ${user.name || user.email}\nVai trò: ${user.roles.join(", ") || "Thành viên"}\n\nTính năng cấu hình tài khoản, mã vạch và mã QR cá nhân đang trong giai đoạn phát triển, vui lòng thử lại sau.`
    );
  };

  const handleBackPress = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng xuất", style: "destructive", onPress: onLogout },
      ]
    );
  };

  // Filter organizations by search text and filter pill
  const filteredOrgs = organizations.filter((org) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      org.name.toLowerCase().includes(query) ||
      org.slug.toLowerCase().includes(query) ||
      (org.description && org.description.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (selectedFilter === "HAS_ROOMS") {
      return (org.room_count || 0) > 0;
    }
    if (selectedFilter === "MANAGED") {
      const r = (org.org_role || "").toUpperCase();
      return user.is_super_admin || r === "OWNER" || r === "ADMIN" || r === "MANAGER";
    }
    if (selectedFilter === "MEMBER") {
      const r = (org.org_role || "MEMBER").toUpperCase();
      return r === "MEMBER";
    }
    return true;
  });

  const renderRoleBadge = (orgRole?: string) => {
    const roleUpper = (orgRole || "MEMBER").toUpperCase();
    if (user.is_super_admin) {
      return (
        <View style={styles.roleBadgeSuperAdmin}>
          <Text style={styles.roleTextSuperAdmin}>🛡️ SUPER ADMIN</Text>
        </View>
      );
    }
    if (roleUpper === "OWNER") {
      return (
        <View style={styles.roleBadgeOwner}>
          <Text style={styles.roleTextOwner}>👑 OWNER</Text>
        </View>
      );
    }
    if (roleUpper === "ADMIN" || roleUpper === "MANAGER") {
      return (
        <View style={styles.roleBadgeAdmin}>
          <Text style={styles.roleTextAdmin}>⚡ ADMIN</Text>
        </View>
      );
    }
    return (
      <View style={styles.roleBadgeMember}>
        <View style={styles.roleDotMember} />
        <Text style={styles.roleTextMember}>MEMBER</Text>
      </View>
    );
  };

  const renderOrgIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes("bdc")) {
      return (
        <View style={[styles.orgIconBox, { backgroundColor: "#0F2B5C" }]}>
          <Image
            source={require("../../assets/bdclogo.png")}
            style={styles.orgIconImg}
            resizeMode="contain"
          />
        </View>
      );
    }
    if (s.includes("hpc") || s.includes("summer")) {
      return (
        <View style={[styles.orgIconBox, { backgroundColor: "#0C1B33" }]}>
          <Text style={styles.orgIconEmoji}>💻</Text>
        </View>
      );
    }
    if (s.includes("bxdd") || s.includes("dang")) {
      return (
        <View style={[styles.orgIconBox, { backgroundColor: "#064E3B" }]}>
          <Text style={styles.orgIconEmoji}>🌱</Text>
        </View>
      );
    }
    if (s.includes("organizer") || s.includes("event")) {
      return (
        <View style={[styles.orgIconBox, { backgroundColor: "#1D4ED8" }]}>
          <Text style={styles.orgIconEmoji}>📅</Text>
        </View>
      );
    }
    return (
      <View style={[styles.orgIconBox, { backgroundColor: "#581C87" }]}>
        <Text style={styles.orgIconEmoji}>⚛️</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Top Bar with Back, Brand, and User Profile Icon ────────────── */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.navBrandCol}>
            <View style={styles.navBrandRow}>
              <Image
                source={require("../../assets/bdclogo.png")}
                style={styles.navLogo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.navTitleMain}>BIG DATA CLUB</Text>
                <Text style={styles.navTitleSub}>HCMUT</Text>
              </View>
            </View>
          </View>

          {/* User Profile Avatar (Alerts feature in development) */}
          <TouchableOpacity
            style={styles.userAvatarBtn}
            onPress={handleUserProfilePress}
            activeOpacity={0.8}
          >
            <View style={styles.userAvatarCircle}>
              <Text style={styles.userAvatarText}>
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userActiveDot} />
          </TouchableOpacity>
        </View>

        {/* ── Hero Section (Step 1, Title, Subtitle, and 3D Graphic) ─────── */}
        <View style={styles.heroSection}>
          <View style={styles.heroContentLeft}>
            <Text style={styles.stepBadgeText}>BƯỚC 1 / 2</Text>
            <Text style={styles.screenTitle}>Chọn tổ chức của bạn</Text>
            <Text style={styles.screenSubtitle}>
              Quyền hạn của bạn được đồng bộ trực tiếp từ Auth Service theo từng tổ chức.
            </Text>
          </View>

          {/* 3D Isometric Hexagon / Cloud graphic */}
          <View style={styles.isometricGraphicBox}>
            <View style={styles.isometricPlatformBase}>
              <View style={styles.isometricPlatformTop}>
                <View style={styles.hexagonIcon}>
                  <Text style={styles.hexagonCloudText}>☁️</Text>
                </View>
              </View>
            </View>
            <View style={styles.floatingCubeOne} />
            <View style={styles.floatingCubeTwo} />
          </View>
        </View>

        {/* ── Super Admin Inspection Banner (if Super Admin) ──────────────── */}
        {user.is_super_admin && onNavigateToInspection && (
          <TouchableOpacity
            style={styles.inspectionBanner}
            onPress={onNavigateToInspection}
            activeOpacity={0.85}
          >
            <View style={styles.inspectionBannerLeft}>
              <View style={styles.inspectionBadge}>
                <Text style={styles.inspectionBadgeText}>🛡️ TOÀN QUYỀN HỆ THỐNG</Text>
              </View>
              <Text style={styles.inspectionBannerTitle}>Super Admin Inspection</Text>
              <Text style={styles.inspectionBannerSub}>
                Tra cứu cấu trúc Bottom-Up: Tổ chức → Phòng trực → Lịch sử quét & Ca trực
              </Text>
            </View>
            <Text style={styles.inspectionBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* ── Search Bar ─────────────────────────────────────────────────── */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm tổ chức, sự kiện..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Filter Pills (Practical DutyLog filters) ───────────────────── */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === "ALL" && styles.filterPillActive]}
            onPress={() => setSelectedFilter("ALL")}
            activeOpacity={0.8}
          >
            <Text style={styles.filterPillIcon}>▦</Text>
            <Text style={[styles.filterPillText, selectedFilter === "ALL" && styles.filterPillTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === "HAS_ROOMS" && styles.filterPillActive]}
            onPress={() => setSelectedFilter("HAS_ROOMS")}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: "#10B981" }]} />
            <Text style={[styles.filterPillText, selectedFilter === "HAS_ROOMS" && styles.filterPillTextActive]}>
              Có phòng trực
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === "MANAGED" && styles.filterPillActive]}
            onPress={() => setSelectedFilter("MANAGED")}
            activeOpacity={0.8}
          >
            <Text style={styles.filterPillIcon}>⚡</Text>
            <Text style={[styles.filterPillText, selectedFilter === "MANAGED" && styles.filterPillTextActive]}>
              Quản lý / Admin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === "MEMBER" && styles.filterPillActive]}
            onPress={() => setSelectedFilter("MEMBER")}
            activeOpacity={0.8}
          >
            <Text style={styles.filterPillIcon}>👥</Text>
            <Text style={[styles.filterPillText, selectedFilter === "MEMBER" && styles.filterPillTextActive]}>
              Thành viên
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Organizations List ─────────────────────────────────────────── */}
        <FlatList
          data={filteredOrgs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => onSelectOrg(item)}
            >
              {/* Left Organization Icon */}
              {renderOrgIcon(item.slug)}

              {/* Center Content */}
              <View style={styles.cardBody}>
                {/* Top Row: Slug + Role Badge + Chevron */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.slugBadge}>
                    <Text style={styles.slugText}>
                      ORG #{item.id} · {item.slug.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.roleAndArrowRow}>
                    {renderRoleBadge(item.org_role)}
                    <Text style={styles.chevronArrow}>›</Text>
                  </View>
                </View>

                {/* Organization Name */}
                <Text style={styles.orgName} numberOfLines={1}>
                  {item.name}
                </Text>

                {/* Description */}
                {item.description ? (
                  <Text style={styles.orgDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Metadata Tags Row */}
                <View style={styles.tagsRow}>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagIcon}>👥</Text>
                    <Text style={styles.tagText}>{item.room_count ?? 0} Phòng trực</Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagIcon}>📍</Text>
                    <Text style={styles.tagText}>HCMUT</Text>
                  </View>
                  <View style={styles.tagPill}>
                    <View style={styles.activeTagDot} />
                    <Text style={styles.tagText}>Đang hoạt động</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy tổ chức nào</Text>
              <Text style={styles.emptySub}>
                Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight || 24) + 6 : 4,
  },

  // ── Top Bar ───────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backArrow: {
    fontSize: 26,
    color: "#334155",
    fontWeight: "300",
    marginTop: -4,
  },
  navBrandCol: {
    flex: 1,
    marginLeft: 12,
  },
  navBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navLogo: {
    width: 30,
    height: 30,
  },
  navTitleMain: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F2B5C",
    letterSpacing: 0.5,
  },
  navTitleSub: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.2,
  },
  userAvatarBtn: {
    position: "relative",
  },
  userAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#2563EB",
  },
  userActiveDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  // ── Hero Section ──────────────────────────────────────────────────────────
  heroSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  heroContentLeft: {
    flex: 1,
    paddingRight: 10,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 1,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    lineHeight: 17,
  },

  // 3D Isometric Graphic Box
  isometricGraphicBox: {
    width: 86,
    height: 86,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  isometricPlatformBase: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.18)",
  },
  isometricPlatformTop: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  hexagonIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  hexagonCloudText: {
    fontSize: 22,
  },
  floatingCubeOne: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: "#60A5FA",
    opacity: 0.7,
  },
  floatingCubeTwo: {
    position: "absolute",
    bottom: 6,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#93C5FD",
    opacity: 0.7,
  },

  // ── Super Admin Banner ────────────────────────────────────────────────────
  inspectionBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inspectionBannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  inspectionBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  inspectionBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#D97706",
    letterSpacing: 0.5,
  },
  inspectionBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B45309",
  },
  inspectionBannerSub: {
    fontSize: 11,
    color: "#78350F",
    marginTop: 2,
    lineHeight: 15,
  },
  inspectionBannerArrow: {
    fontSize: 18,
    fontWeight: "900",
    color: "#D97706",
  },

  // ── Search Bar ────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginHorizontal: 18,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#0F172A",
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
  },

  // ── Filter Pills Row ──────────────────────────────────────────────────────
  filterPillsRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginBottom: 14,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  filterPillIcon: {
    fontSize: 11,
    color: "#64748B",
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },

  // ── Organization Cards ────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  orgIconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  orgIconImg: {
    width: 32,
    height: 32,
  },
  orgIconEmoji: {
    fontSize: 24,
  },
  cardBody: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  slugBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slugText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.4,
  },
  roleAndArrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleBadgeMember: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 4,
  },
  roleDotMember: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  roleTextMember: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.4,
  },
  roleBadgeAdmin: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  roleTextAdmin: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#2563EB",
  },
  roleBadgeOwner: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  roleTextOwner: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#D97706",
  },
  roleBadgeSuperAdmin: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  roleTextSuperAdmin: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#DC2626",
  },
  chevronArrow: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "600",
    lineHeight: 18,
  },
  orgName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  orgDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  tagIcon: {
    fontSize: 10,
  },
  activeTagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#475569",
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});
