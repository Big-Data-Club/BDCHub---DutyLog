import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
} from "react-native";
import { Organization, User } from "../types";

interface Props {
  user: User;
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
  onLogout: () => void;
  onNavigateToInspection?: () => void;
}

export const OrgSelectionScreen: React.FC<Props> = ({
  user,
  organizations,
  onSelectOrg,
  onLogout,
  onNavigateToInspection,
}) => {
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
        <Text style={styles.roleTextMember}>🟢 MEMBER</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* High-Tech Top Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/bdclogo.png")}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.greetingText}>ĐÃ XÁC THỰC ĐỊNH DANH</Text>
            <Text style={styles.userNameText}>{user.name || user.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Title & Prompt */}
      <View style={styles.titleSection}>
        <Text style={styles.stepBadge}>BƯỚC 1 / 2</Text>
        <Text style={styles.screenTitle}>Chọn tổ chức làm việc</Text>
        <Text style={styles.screenSubtitle}>
          Quyền hạn của bạn được đồng bộ trực tiếp từ Auth Service theo từng tổ chức
        </Text>
      </View>

      {/* Super Admin Inspection Banner */}
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
              Kiểm tra Bottom-Up: Tổ chức → Phòng trực → Lịch sử quét & Ca trực
            </Text>
          </View>
          <Text style={styles.inspectionBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Organizations List */}
      <FlatList
        data={organizations}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.82}
            onPress={() => onSelectOrg(item)}
          >
            <View style={styles.cardGlowLeft} />

            <View style={styles.cardTop}>
              <View style={styles.slugBadge}>
                <Text style={styles.slugText}>ORG #{item.id} · {item.slug.toUpperCase()}</Text>
              </View>
              {renderRoleBadge(item.org_role)}
            </View>

            <Text style={styles.orgName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.orgDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.cardBottom}>
              <View style={styles.roomBadge}>
                <Text style={styles.roomBadgeText}>
                  🏢 {item.room_count ?? 0} Phòng trực
                </Text>
              </View>
              <View style={styles.enterAction}>
                <Text style={styles.enterActionText}>Tiếp tục chọn phòng</Text>
                <Text style={styles.enterActionArrow}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có tổ chức nào được gán cho tài khoản này.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 36,
    height: 36,
  },
  greetingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 1,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  logoutBtn: {
    backgroundColor: "#131E35",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  stepBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#00F0FF",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  list: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  cardGlowLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#00F0FF",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  slugBadge: {
    backgroundColor: "#131E35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  slugText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  roleBadgeOwner: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTextOwner: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FBBF24",
    letterSpacing: 0.5,
  },
  roleBadgeAdmin: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTextAdmin: {
    fontSize: 10,
    fontWeight: "900",
    color: "#60A5FA",
    letterSpacing: 0.5,
  },
  roleBadgeSuperAdmin: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderWidth: 1,
    borderColor: "#A855F7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTextSuperAdmin: {
    fontSize: 10,
    fontWeight: "900",
    color: "#C084FC",
    letterSpacing: 0.5,
  },
  roleBadgeMember: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTextMember: {
    fontSize: 10,
    fontWeight: "900",
    color: "#34D399",
    letterSpacing: 0.5,
  },
  orgName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  orgDesc: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 18,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  roomBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roomBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E2E8F0",
  },
  enterAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  enterActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00F0FF",
  },
  enterActionArrow: {
    fontSize: 15,
    fontWeight: "900",
    color: "#00F0FF",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
  },
  inspectionBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
    marginBottom: 6,
  },
  inspectionBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  inspectionBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FBBF24",
  },
  inspectionBannerSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
    lineHeight: 16,
  },
  inspectionBannerArrow: {
    fontSize: 18,
    fontWeight: "900",
    color: "#F59E0B",
  },
});
