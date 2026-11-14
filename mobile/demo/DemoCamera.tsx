import React from 'react';
import { Pressable, Text, View } from 'react-native';

// The real ScanCheckinScreen renders this camera adapter. No hardware permissions.
export function BarCodeScanner({ onBarCodeScanned }: { onBarCodeScanned?: (event: { type: string; data: string }) => void }) {
  return <View style={{ flex: 1, backgroundColor: '#132240', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', gap: 3, height: 60, alignItems: 'stretch' }}>
      {Array.from({ length: 32 }, (_, i) => <View key={i} style={{ width: i % 3 === 0 ? 4 : 2, backgroundColor: '#94A3B8' }} />)}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Quét thẻ mẫu DEMO001" disabled={!onBarCodeScanned} onPress={() => onBarCodeScanned?.({ type: 'code128', data: 'DEMO001' })} style={{ position: 'absolute', zIndex: 20, bottom: 10, backgroundColor: '#2860EE', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 }}>
      <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Quét thẻ mẫu DEMO001</Text>
    </Pressable>
  </View>;
}
BarCodeScanner.requestPermissionsAsync = async () => ({ status: 'granted' });
