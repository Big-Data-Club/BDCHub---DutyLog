import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
} from "react-native";
import { Room, Organization, User } from "../types";
import { resolveDisplayName } from "../api/client";

interface Props {
  user: User;
  organization: Organization;
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onBackToOrg: () => void;
  onLogout: () => void;
  onNavigateToInspection?: () => void;
}

type RoomFilterType = "ALL" | "CS1" | "CS2" | "AVAILABLE";

export const RoomSelectionScreen: React.FC<Props> = ({
  user,
  organization,
  rooms,
  selectedRoom,
  onSelectRoom,
  onBackToOrg,
  onLogout,
  onNavigateToInspection,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<RoomFilterType>("ALL");

  const displayName = resolveDisplayName(user.name, user.email);

  const handleUserProfilePress = () => {
    Alert.alert(
      "Tài khoản định danh",
      `Họ và tên: ${displayName}\nEmail: ${user.email}\nVai trò: ${user.roles.join(", ") || "Thành viên"}\n\nTính năng cấu hình tài khoản, mã vạch và mã QR cá nhân đang trong giai đoạn phát triển, vui lòng thử lại sau.`
    );
  };

  // Filter rooms by search query and category filter
  const filteredRooms = rooms.filter((room) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      room.name.toLowerCase().includes(q) ||
      room.id.toLowerCase().includes(q) ||
      room.building.toLowerCase().includes(q) ||
      room.room_number.toLowerCase().includes(q) ||
      room.campus.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedFilter === "CS1") {
      const c = room.campus.toLowerCase();
      return c.includes("campus 1") || c.includes("cs1") || c.includes("cơ sở 1");
    }
    if (selectedFilter === "CS2") {
      const c = room.campus.toLowerCase();
      return c.includes("campus 2") || c.includes("cs2") || c.includes("cơ sở 2");
    }
    if (selectedFilter === "AVAILABLE") {
      const occ = room.current_occupancy || 0;
      const cap = room.capacity || 30;
      return occ < cap;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToOrg}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.navOrgCol}>
            <View style={styles.navOrgRow}>
              <Image
                source={require("../../assets/bdclogo.png")}
                style={styles.navLogo}
                resizeMode="contain"
              />
              <View style={styles.navOrgTextCol}>
                <Text style={styles.navOrgBadge}>TỔ CHỨC ĐÃ CHỌN</Text>
                <Text style={styles.navOrgName} numberOfLines={1}>
                  {organization.name}
                </Text>
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
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userActiveDot} />
          </TouchableOpacity>
        </View>

        {/* ── Hero Section (Step 2, Title, Subtitle, 3D Graphic) ─────────── */}
        <View style={styles.heroSection}>
          <View style={styles.heroContentLeft}>
            <Text style={styles.stepBadgeText}>BƯỚC 2 / 2</Text>
            <Text style={styles.screenTitle}>Chọn phòng trực</Text>
            <Text style={styles.screenSubtitle}>
              Chọn phòng trực để truy cập trạm điều khiển, quét điểm danh và quản lý phiên trực.
            </Text>
          </View>

          {/* 3D Isometric Room Graphic Box */}
          <View style={styles.isometricGraphicBox}>
            <View style={styles.isometricPlatformBase}>
              <View style={styles.isometricPlatformTop}>
                <Text style={styles.isometricRoomEmoji}>🏢</Text>
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
                Cấu trúc phân cấp: {organization.name} → Phòng trực → Lịch sử quét & Ca trực
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
            placeholder="Tìm kiếm phòng trực, tòa nhà, mã phòng..."
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

        {/* ── Filter Pills for Rooms ─────────────────────────────────────── */}
        {/* ── Filter Pills for Rooms (Horizontal Scroll, No Overflow) ────── */}
        <View style={styles.filterPillsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScroll}
          >
            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === "ALL" && styles.filterPillActive]}
              onPress={() => setSelectedFilter("ALL")}
              activeOpacity={0.8}
            >
              <Text style={styles.filterPillIcon}>▦</Text>
              <Text style={[styles.filterPillText, selectedFilter === "ALL" && styles.filterPillTextActive]}>
                Tất cả ({rooms.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === "CS1" && styles.filterPillActive]}
              onPress={() => setSelectedFilter("CS1")}
              activeOpacity={0.8}
            >
              <Text style={styles.filterPillIcon}>📍</Text>
              <Text style={[styles.filterPillText, selectedFilter === "CS1" && styles.filterPillTextActive]}>
                Cơ sở 1
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === "CS2" && styles.filterPillActive]}
              onPress={() => setSelectedFilter("CS2")}
              activeOpacity={0.8}
            >
              <Text style={styles.filterPillIcon}>📍</Text>
              <Text style={[styles.filterPillText, selectedFilter === "CS2" && styles.filterPillTextActive]}>
                Cơ sở 2
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === "AVAILABLE" && styles.filterPillActive]}
              onPress={() => setSelectedFilter("AVAILABLE")}
              activeOpacity={0.8}
            >
              <View style={[styles.filterDot, { backgroundColor: "#10B981" }]} />
              <Text style={[styles.filterPillText, selectedFilter === "AVAILABLE" && styles.filterPillTextActive]}>
                Còn chỗ ({rooms.filter(r => (r.current_occupancy || 0) < (r.capacity || 30)).length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Rooms List ─────────────────────────────────────────────────── */}
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = selectedRoom?.id === item.id;
            const occupancy = item.current_occupancy || 0;
            const capacity = item.capacity || 30;
            const ratio = Math.min(occupancy / capacity, 1);
            const percent = Math.round(ratio * 100);

            const isHigh = percent >= 85;
            const isMedium = percent >= 50;

            return (
              <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                activeOpacity={0.85}
                onPress={() => onSelectRoom(item)}
              >
                {/* Left Room Icon */}
                <View style={[styles.roomIconBox, isHigh ? styles.iconHigh : styles.iconNormal]}>
                  <Text style={styles.roomIconEmoji}>🏢</Text>
                </View>

                {/* Center Content */}
                <View style={styles.cardBody}>
                  {/* Top Row: Slug + Capacity Badge + Chevron */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.slugBadge}>
                      <Text style={styles.slugText} numberOfLines={1}>
                        TÒA {item.building} · P.{item.room_number}
                      </Text>
                    </View>
                    <View style={styles.roleAndArrowRow}>
                      <View
                        style={[
                          styles.occupancyBadge,
                          isHigh
                            ? styles.occBadgeHigh
                            : isMedium
                            ? styles.occBadgeMed
                            : styles.occBadgeLow,
                        ]}
                      >
                        <View
                          style={[
                            styles.occDot,
                            {
                              backgroundColor: isHigh
                                ? "#EF4444"
                                : isMedium
                                ? "#F59E0B"
                                : "#10B981",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.occupancyText,
                            {
                              color: isHigh
                                ? "#DC2626"
                                : isMedium
                                ? "#D97706"
                                : "#059669",
                            },
                          ]}
                        >
                          {occupancy}/{capacity} ({percent}%)
                        </Text>
                      </View>
                      <Text style={styles.chevronArrow}>›</Text>
                    </View>
                  </View>

                  {/* Room Name */}
                  <Text style={styles.roomName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Room Location Details */}
                  <Text style={styles.roomDetail}>
                    Phòng số {item.room_number} · Tòa nhà {item.building} · {item.campus}
                  </Text>

                  {/* Capacity Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: isHigh
                            ? "#EF4444"
                            : isMedium
                            ? "#F59E0B"
                            : "#2563EB",
                        },
                      ]}
                    />
                  </View>

                  {/* Tags Row */}
                  <View style={styles.tagsRow}>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagIcon}>📍</Text>
                      <Text style={styles.tagText}>{item.campus}</Text>
                    </View>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagIcon}>👥</Text>
                      <Text style={styles.tagText}>Sức chứa: {capacity}</Text>
                    </View>
                    <View style={styles.tagPill}>
                      <View style={styles.activeTagDot} />
                      <Text style={styles.tagText}>Đang mở cửa</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy phòng trực nào</Text>
              <Text style={styles.emptySub}>
                Không có phòng nào phù hợp với từ khóa hoặc bộ lọc đã chọn.
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
  navOrgCol: {
    flex: 1,
    marginLeft: 12,
  },
  navOrgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navLogo: {
    width: 28,
    height: 28,
  },
  navOrgTextCol: {
    flex: 1,
  },
  navOrgBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.5,
  },
  navOrgName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F2B5C",
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

  // 3D Isometric Room Graphic
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
  isometricRoomEmoji: {
    fontSize: 24,
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
  filterPillsWrapper: {
    marginBottom: 14,
  },
  filterPillsScroll: {
    paddingHorizontal: 18,
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

  // ── Room Cards ────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F2B5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  cardSelected: {
    borderColor: "#2563EB",
    borderWidth: 1.5,
  },
  roomIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  iconNormal: {
    backgroundColor: "#EFF6FF",
  },
  iconHigh: {
    backgroundColor: "#FEF2F2",
  },
  roomIconEmoji: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
    overflow: "hidden",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    width: "100%",
  },
  slugBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 1,
    marginRight: 6,
  },
  slugText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.3,
  },
  roleAndArrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  occupancyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 4,
  },
  occBadgeLow: {
    backgroundColor: "#ECFDF5",
  },
  occBadgeMed: {
    backgroundColor: "#FEF3C7",
  },
  occBadgeHigh: {
    backgroundColor: "#FEE2E2",
  },
  occDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  occupancyText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  chevronArrow: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "700",
    lineHeight: 16,
    marginRight: 2,
    marginLeft: 2,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  roomDetail: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
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
