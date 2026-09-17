import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { Room } from "../types";

interface Props {
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onNavigateToScan: () => void;
  onNavigateToRoster: () => void;
  onNavigateToQR: () => void;
}

export const RoomSelectionScreen: React.FC<Props> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
  onNavigateToScan,
  onNavigateToRoster,
  onNavigateToQR,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BDCHub - DutyLog</Text>
        <Text style={styles.subtitle}>Select Room for Attendance & Duty</Text>
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
                    {item.current_occupancy} / {item.capacity}
                  </Text>
                </View>
              </View>

              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomDetail}>
                Building {item.building} • Room {item.room_number}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {selectedRoom && (
        <View style={styles.footer}>
          <Text style={styles.activeRoomLabel}>
            Active: <Text style={{ fontWeight: "700" }}>{selectedRoom.name}</Text>
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onNavigateToRoster}
            >
              <Text style={styles.buttonSecondaryText}>View Presence</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onNavigateToQR}
            >
              <Text style={styles.buttonSecondaryText}>Tạo QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onNavigateToScan}
            >
              <Text style={styles.buttonPrimaryText}>Open Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
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
    fontSize: 12,
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
    fontWeight: "700",
    color: "#1E293B",
  },
  roomDetail: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  activeRoomLabel: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#2563EB",
  },
  buttonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonSecondary: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  buttonSecondaryText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "600",
  },
});
