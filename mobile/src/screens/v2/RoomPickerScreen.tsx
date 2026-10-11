import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, MapPin } from 'lucide-react-native';
import type { Room } from '../../types';
import { Card, Empty, HeaderBack, SmallLabel, textStyles } from '../../ui/Kit';
import { palette, roomShort } from '../../ui/theme';
export const RoomPickerScreen: React.FC<{ rooms: Room[]; selectedRoom: Room | null; onSelect: (room: Room) => void; onBack: () => void }> = ({ rooms, selectedRoom, onSelect, onBack }) =>
  <ScrollView contentContainerStyle={{ padding: 19, flexGrow: 1 }}>
    <HeaderBack title="Chọn phòng trực" eyebrow="PHÒNG ĐANG QUẢN LÝ" onBack={onBack}/>
    <Text style={[textStyles.muted, { marginBottom: 16 }]}>Dữ liệu và lịch sử được hiển thị theo phòng bạn chọn.</Text>
    {rooms.length ? rooms.map(room => <TouchableOpacity key={room.id} onPress={() => onSelect(room)} style={{ marginBottom: 12 }}>
      <Card style={{ borderWidth: 1, borderColor: room.id === selectedRoom?.id ? palette.blue : palette.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><MapPin color={palette.blue} size={21}/><View style={{ flex: 1 }}>
          <SmallLabel>{room.campus.toUpperCase()} · P.{roomShort(room)}</SmallLabel>
          <Text style={[textStyles.headline, { marginVertical: 5 }]}>{room.name}</Text><Text style={textStyles.muted}>Sức chứa {room.capacity} · Hiện có {room.current_occupancy} người</Text>
        </View>{room.id === selectedRoom?.id ? <CheckCircle2 color={palette.blue}/> : null}</View>
      </Card></TouchableOpacity>) : <Empty title="Chưa có phòng" description="Tổ chức hiện chưa cấu hình phòng trực."/>}
  </ScrollView>;
