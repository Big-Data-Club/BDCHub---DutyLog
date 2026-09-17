import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Room, Organization, User } from "./src/types";
import { fetchRooms, fetchUserOrganizations, setCurrentUser } from "./src/api/client";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OrgSelectionScreen } from "./src/screens/OrgSelectionScreen";
import { RoomSelectionScreen } from "./src/screens/RoomSelectionScreen";
import { DutyRoomActionsScreen } from "./src/screens/DutyRoomActionsScreen";
import { ScanCheckinScreen } from "./src/screens/ScanCheckinScreen";
import { LiveRosterScreen } from "./src/screens/LiveRosterScreen";
import { QRDisplayScreen } from "./src/screens/QRDisplayScreen";
import { AdminInspectionScreen } from "./src/screens/AdminInspectionScreen";

type Screen =
  | "LOGIN"
  | "ORG_SELECT"
  | "ROOMS"
  | "ROOM_ACTIONS"
  | "SCAN"
  | "ROSTER"
  | "QR_DISPLAY"
  | "ADMIN_INSPECTION";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("LOGIN");
  const [currentUserState, setCurrentUserState] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUserState(user);
    setLoading(true);
    try {
      const orgsData = await fetchUserOrganizations();
      const orgList = orgsData.organizations || [];
      setOrganizations(orgList);

      // Organization Selection Rule:
      // - Belongs to 1 Org: Automatically navigate into that Org.
      // - Belongs to multiple Orgs: Select an Org manually.
      if (orgList.length === 1 && !user.is_super_admin) {
        const singleOrg = orgList[0];
        setSelectedOrg(singleOrg);
        const roomList = await fetchRooms(singleOrg.id);
        setRooms(roomList);
        setCurrentScreen("ROOMS");
      } else {
        // Multi-Org or Super Admin: show Org Selection screen
        setCurrentScreen("ORG_SELECT");
      }
    } catch (e) {
      console.warn("Failed to load user organizations:", e);
      setCurrentScreen("ORG_SELECT");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = async (org: Organization) => {
    setSelectedOrg(org);
    setLoading(true);
    try {
      const roomList = await fetchRooms(org.id);
      setRooms(roomList);
      setCurrentScreen("ROOMS");
    } catch (e) {
      console.warn("Failed to load rooms for org:", e);
      setCurrentScreen("ROOMS");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setCurrentScreen("ROOM_ACTIONS");
  };

  const reloadRooms = async () => {
    if (selectedOrg) {
      const list = await fetchRooms(selectedOrg.id);
      setRooms(list);
      if (selectedRoom) {
        const updated = list.find((r) => r.id === selectedRoom.id);
        if (updated) setSelectedRoom(updated);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    setSelectedOrg(null);
    setSelectedRoom(null);
    setRooms([]);
    setOrganizations([]);
    setCurrentScreen("LOGIN");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      {/* 1. Authentication & Authorization Screen */}
      {currentScreen === "LOGIN" && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. Organization Selection Screen (Multi-org or Super Admin) */}
      {currentScreen === "ORG_SELECT" && currentUserState && (
        <OrgSelectionScreen
          user={currentUserState}
          organizations={organizations}
          onSelectOrg={handleSelectOrg}
          onLogout={handleLogout}
        />
      )}

      {/* 3. Room Selection Screen (Prompt: "Select Duty Room") */}
      {currentScreen === "ROOMS" && currentUserState && selectedOrg && (
        <RoomSelectionScreen
          user={currentUserState}
          organization={selectedOrg}
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={handleSelectRoom}
          canChangeOrg={organizations.length > 1 || currentUserState.is_super_admin}
          onChangeOrg={() => setCurrentScreen("ORG_SELECT")}
          onNavigateToInspection={() => setCurrentScreen("ADMIN_INSPECTION")}
          onLogout={handleLogout}
        />
      )}

      {/* 4. Duty Room Actions Screen (On-Duty Operations & QR Option) */}
      {currentScreen === "ROOM_ACTIONS" && currentUserState && selectedRoom && (
        <DutyRoomActionsScreen
          user={currentUserState}
          room={selectedRoom}
          onBack={() => {
            reloadRooms();
            setCurrentScreen("ROOMS");
          }}
          onNavigateToScan={() => setCurrentScreen("SCAN")}
          onNavigateToQR={() => setCurrentScreen("QR_DISPLAY")}
          onNavigateToRoster={() => setCurrentScreen("ROSTER")}
        />
      )}

      {/* 5. On-Duty Operations: Scanner Screen (with RED Invalid Access Alert) */}
      {currentScreen === "SCAN" && selectedRoom && (
        <ScanCheckinScreen
          room={selectedRoom}
          onBack={() => {
            reloadRooms();
            setCurrentScreen("ROOM_ACTIONS");
          }}
          onSuccess={() => {
            reloadRooms();
          }}
        />
      )}

      {/* 6. Standalone Check-in QR Code Screen */}
      {currentScreen === "QR_DISPLAY" && selectedRoom && (
        <QRDisplayScreen
          room={selectedRoom}
          onBack={() => {
            reloadRooms();
            setCurrentScreen("ROOM_ACTIONS");
          }}
        />
      )}

      {/* 7. Live Room Occupants Roster Screen */}
      {currentScreen === "ROSTER" && selectedRoom && (
        <LiveRosterScreen
          room={selectedRoom}
          onBack={() => {
            reloadRooms();
            setCurrentScreen("ROOM_ACTIONS");
          }}
          onOpenScanner={() => setCurrentScreen("SCAN")}
        />
      )}

      {/* 8. Super Admin Flow: Bottom-Up System Inspection */}
      {currentScreen === "ADMIN_INSPECTION" && (
        <AdminInspectionScreen
          onBack={() => setCurrentScreen("ROOMS")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    zIndex: 99,
    justifyContent: "center",
    alignItems: "center",
  },
});
