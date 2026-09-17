import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Room, Organization, User } from "./src/types";
import { fetchRooms, fetchUserOrganizations, setCurrentUser } from "./src/api/client";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OrgSelectionScreen } from "./src/screens/OrgSelectionScreen";
import { RoomSelectionScreen } from "./src/screens/RoomSelectionScreen";
import { DutyStationScreen } from "./src/screens/DutyStationScreen";
import { ScanCheckinScreen } from "./src/screens/ScanCheckinScreen";
import { QRDisplayScreen } from "./src/screens/QRDisplayScreen";
import { AdminInspectionScreen } from "./src/screens/AdminInspectionScreen";

type Screen =
  | "LOGIN"
  | "ORG_SELECT"
  | "ROOMS"
  | "DUTY_STATION"
  | "SCAN"
  | "QR_DISPLAY"
  | "ADMIN_INSPECTION";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("LOGIN");
  const [currentUserState, setCurrentUserState] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [scannerMode, setScannerMode] = useState<"BARCODE" | "QR_SCAN">("BARCODE");
  const [loading, setLoading] = useState(false);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUserState(user);
    setLoading(true);
    try {
      const orgsData = await fetchUserOrganizations();
      const orgList = orgsData.organizations || [];
      setOrganizations(orgList);
      // All users go through the initial flow: Login -> Org Selection -> Room Selection -> Duty Station
      setCurrentScreen("ORG_SELECT");
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
    setCurrentScreen("DUTY_STATION");
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
          <ActivityIndicator size="large" color="#00F0FF" />
        </View>
      )}

      {/* 1. Authentication & Authorization Screen */}
      {currentScreen === "LOGIN" && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. Organization Selection Screen (Displays role: OWNER, ADMIN, MEMBER, SUPER ADMIN) */}
      {currentScreen === "ORG_SELECT" && currentUserState && (
        <OrgSelectionScreen
          user={currentUserState}
          organizations={organizations}
          onSelectOrg={handleSelectOrg}
          onLogout={handleLogout}
          onNavigateToInspection={() => setCurrentScreen("ADMIN_INSPECTION")}
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
          onBackToOrg={() => setCurrentScreen("ORG_SELECT")}
          onNavigateToInspection={() => setCurrentScreen("ADMIN_INSPECTION")}
          onLogout={handleLogout}
        />
      )}

      {/* 4. Duty Station Screen (High-tech Banking UI, Hero Scan, History, Live Roster, Shifts) */}
      {currentScreen === "DUTY_STATION" && currentUserState && selectedOrg && selectedRoom && (
        <DutyStationScreen
          user={currentUserState}
          organization={selectedOrg}
          room={selectedRoom}
          onBackToRooms={() => {
            reloadRooms();
            setCurrentScreen("ROOMS");
          }}
          onOpenScanner={(mode) => {
            setScannerMode(mode);
            setCurrentScreen("SCAN");
          }}
          onOpenPersonalQR={() => setCurrentScreen("QR_DISPLAY")}
          onLogout={handleLogout}
          onNavigateToInspection={() => setCurrentScreen("ADMIN_INSPECTION")}
        />
      )}

      {/* 5. Scanner Screen (Barcode or QR scan with HUD, manual entry, RED invalid member alert) */}
      {currentScreen === "SCAN" && selectedRoom && (
        <ScanCheckinScreen
          room={selectedRoom}
          initialMode={scannerMode}
          onBack={() => {
            reloadRooms();
            setCurrentScreen("DUTY_STATION");
          }}
          onSuccess={() => {
            reloadRooms();
          }}
        />
      )}

      {/* 6. Standalone Personal Check-in QR Code Screen (Rotating 10s HMAC token) */}
      {currentScreen === "QR_DISPLAY" && selectedRoom && (
        <QRDisplayScreen
          user={currentUserState || undefined}
          room={selectedRoom}
          onBack={() => {
            reloadRooms();
            setCurrentScreen("DUTY_STATION");
          }}
        />
      )}

      {/* 7. Super Admin Flow: Bottom-Up System Inspection */}
      {currentScreen === "ADMIN_INSPECTION" && (
        <AdminInspectionScreen
          onBack={() => {
            if (selectedRoom) {
              setCurrentScreen("DUTY_STATION");
            } else if (selectedOrg) {
              setCurrentScreen("ROOMS");
            } else {
              setCurrentScreen("ORG_SELECT");
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 11, 20, 0.75)",
    zIndex: 99,
    justifyContent: "center",
    alignItems: "center",
  },
});
