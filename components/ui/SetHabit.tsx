import { View, TextInput, Button, Modal } from 'react-native';
import { useState } from 'react';

export default function SetHabit({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [habit, setHabit] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" >
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'white', padding: 20, borderRadius: 10}}>
          <TextInput
            placeholder="Enter habit"
            value={habit}
            onChangeText={setHabit}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          <Button title="Save Habit" onPress={onClose} />
      </View>
    </Modal>
  );
}
