import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { Room } from "./src/types";
import { fetchRooms } from "./src/api/client";
import { RoomSelectionScreen } from "./src/screens/RoomSelectionScreen";
import { ScanCheckinScreen } from "./src/screens/ScanCheckinScreen";
import { LiveRosterScreen } from "./src/screens/LiveRosterScreen";
import { QRDisplayScreen } from "./src/screens/QRDisplayScreen";

type Screen = "ROOMS" | "SCAN" | "ROSTER" | "QR_DISPLAY";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("ROOMS");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const list = await fetchRooms(1);
    setRooms(list);
    if (list.length > 0 && !selectedRoom) {
      setSelectedRoom(list[0]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {currentScreen === "ROOMS" && (
        <RoomSelectionScreen
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={setSelectedRoom}
          onNavigateToScan={() => setCurrentScreen("SCAN")}
          onNavigateToRoster={() => setCurrentScreen("ROSTER")}
          onNavigateToQR={() => setCurrentScreen("QR_DISPLAY")}
        />
      )}

      {currentScreen === "SCAN" && selectedRoom && (
        <ScanCheckinScreen
          room={selectedRoom}
          onBack={() => {
            loadRooms();
            setCurrentScreen("ROOMS");
          }}
          onSuccess={() => {
            loadRooms();
          }}
        />
      )}

      {currentScreen === "ROSTER" && selectedRoom && (
        <LiveRosterScreen
          room={selectedRoom}
          onBack={() => {
            loadRooms();
            setCurrentScreen("ROOMS");
          }}
          onOpenScanner={() => setCurrentScreen("SCAN")}
        />
      )}

      {currentScreen === "QR_DISPLAY" && selectedRoom && (
        <QRDisplayScreen
          room={selectedRoom}
          onBack={() => {
            loadRooms();
            setCurrentScreen("ROOMS");
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
