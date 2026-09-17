import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Image,
} from "react-native";
import { Room, Organization, User } from "../types";

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
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Org tag & Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToOrg} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Đổi tổ chức</Text>
        </TouchableOpacity>

        <View style={styles.orgTag}>
          <Image
            source={require("../../assets/bdclogo.png")}
            style={styles.logoMini}
            resizeMode="contain"
          />
          <Text style={styles.orgTagText} numberOfLines={1}>{organization.name}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Thoát</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Title & Prompt */}
      <View style={styles.titleSection}>
        <Text style={styles.stepBadge}>BƯỚC 2 / 2</Text>
        <Text style={styles.screenTitle}>Select Duty Room</Text>
        <Text style={styles.screenSubtitle}>
          Chọn phòng trực để truy cập trạm điều khiển, quét điểm danh và quản lý phiên trực
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
              Xem cấu trúc phân cấp: {organization.name} → Phòng trực → Lịch sử
            </Text>
          </View>
          <Text style={styles.inspectionBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Rooms List */}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selectedRoom?.id === item.id;
          const occupancy = item.current_occupancy || 0;
          const capacity = item.capacity || 30;
          const ratio = Math.min(occupancy / capacity, 1);
          const percent = Math.round(ratio * 100);

          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelectRoom(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.campusBadge}>
                  <Text style={styles.campusBadgeText}>{item.campus}</Text>
                </View>

                <View style={styles.gaugePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.gaugeText}>
                    {occupancy} / {capacity} người ({percent}%)
                  </Text>
                </View>
              </View>

              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomDetail}>
                Tòa nhà {item.building} · Phòng số {item.room_number} · Mã: {item.id}
              </Text>

              {/* Progress bar gauge */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percent}%`,
                      backgroundColor:
                        percent > 85 ? "#EF4444" : percent > 50 ? "#F59E0B" : "#00F0FF",
                    },
                  ]}
                />
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.enterPrompt}>TRUY CẬP PHÒNG TRỰC</Text>
                <Text style={styles.enterArrow}>→</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có phòng trực nào trong tổ chức này.</Text>
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#131E35",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8",
  },
  orgTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#131E35",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: 180,
  },
  logoMini: {
    width: 20,
    height: 20,
  },
  orgTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  logoutBtnText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
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
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardSelected: {
    borderColor: "#00F0FF",
    backgroundColor: "#131E35",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  campusBadge: {
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  campusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#00F0FF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  gaugePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#131E35",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  gaugeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E2E8F0",
  },
  roomName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  roomDetail: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#1E293B",
    borderRadius: 3,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  enterPrompt: {
    fontSize: 12,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  enterArrow: {
    fontSize: 16,
    fontWeight: "900",
    color: "#38BDF8",
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
