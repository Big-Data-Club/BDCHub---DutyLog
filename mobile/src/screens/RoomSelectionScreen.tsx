import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Room, Organization, User } from "../types";

interface Props {
  user: User;
  organization: Organization;
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  canChangeOrg: boolean;
  onChangeOrg: () => void;
  onNavigateToInspection?: () => void;
  onLogout: () => void;
}

export const RoomSelectionScreen: React.FC<Props> = ({
  user,
  organization,
  rooms,
  selectedRoom,
  onSelectRoom,
  canChangeOrg,
  onChangeOrg,
  onNavigateToInspection,
  onLogout,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.orgTag}>
            <Text style={styles.orgTagText}>🏢 {organization.name}</Text>
          </View>
          <View style={styles.topButtons}>
            {user.is_super_admin && onNavigateToInspection && (
              <TouchableOpacity
                style={styles.adminInspectionBtn}
                onPress={onNavigateToInspection}
              >
                <Text style={styles.adminInspectionBtnText}>🔍 Super Admin</Text>
              </TouchableOpacity>
            )}
            {canChangeOrg && (
              <TouchableOpacity style={styles.changeOrgBtn} onPress={onChangeOrg}>
                <Text style={styles.changeOrgBtnText}>Đổi Org</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutBtnText}>Thoát</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>Select Duty Room</Text>
        <Text style={styles.subtitle}>
          Chọn phòng trực để bắt đầu ca làm việc, quét mã sinh viên hoặc tạo mã QR:
        </Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selectedRoom?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelectRoom(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.campusTag}>{item.campus}</Text>
                <View style={styles.occupancyBadge}>
                  <Text style={styles.occupancyText}>
                    Đang có: {item.current_occupancy} / {item.capacity}
                  </Text>
                </View>
              </View>

              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomDetail}>
                Tòa nhà {item.building} • Phòng số {item.room_number}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.enterPrompt}>Vào phòng trực →</Text>
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orgTag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orgTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  topButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  adminInspectionBtn: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  adminInspectionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },
  changeOrgBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  changeOrgBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  logoutBtnText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  list: {
    padding: 20,
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  campusTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    textTransform: "uppercase",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occupancyBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occupancyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  roomName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
  },
  roomDetail: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  enterPrompt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
  },
});
