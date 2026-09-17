import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from "react-native";
import { Organization, User } from "../types";

interface Props {
  user: User;
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
  onLogout: () => void;
}

export const OrgSelectionScreen: React.FC<Props> = ({
  user,
  organizations,
  onSelectOrg,
  onLogout,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user.name}</Text>
          <Text style={styles.title}>Chọn tổ chức (Organization)</Text>
          <Text style={styles.subtitle}>
            Tài khoản của bạn thuộc nhiều tổ chức. Vui lòng chọn tổ chức cần làm việc:
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={organizations}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => onSelectOrg(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.slugTag}>ORG #{item.id} · {item.slug.toUpperCase()}</Text>
              {item.org_role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{item.org_role}</Text>
                </View>
              )}
            </View>

            <Text style={styles.orgName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.orgDesc}>{item.description}</Text>
            ) : null}

            <View style={styles.footerRow}>
              <Text style={styles.roomCountText}>
                🏢 {item.room_count ?? 0} Phòng trực khả dụng
              </Text>
              <Text style={styles.arrowText}>Truy cập →</Text>
            </View>
          </TouchableOpacity>
        )}
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
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  greeting: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    maxWidth: 260,
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  logoutText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    padding: 20,
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  slugTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  orgName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  orgDesc: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  roomCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  arrowText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
});
