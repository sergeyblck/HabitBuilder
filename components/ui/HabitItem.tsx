import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from './ProgressBar';

export default function HabitItem({ habit, onComplete }: { habit: any, onComplete: () => void }) {
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD
  const [isCompletedToday, setIsCompletedToday] = useState(false);

  useEffect(() => {
    setIsCompletedToday(habit.completedDays?.includes(today));
  }, [habit.completedDays]);

  const handlePress = () => {
    if (!isCompletedToday) {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Row for text and button */}
      <View style={styles.row}>
        <Text style={styles.text}>{habit.name}</Text>
        <Pressable 
          onPress={handlePress} 
          style={[styles.button, isCompletedToday && styles.disabledButton]} 
          disabled={isCompletedToday} // ✅ Disables button if completed today
        >
          <Ionicons 
            name={isCompletedToday ? 'close' : 'checkmark'} 
            size={24} 
            color="white" 
          />
        </Pressable>
      </View>

      {/* Progress Bar and Streak/Goal Display */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={habit.streak / habit.goal} />
        <Text style={styles.progressText}>{habit.streak}/{habit.goal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#2c3e50',
    marginVertical: 5,
    borderRadius: 10,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  text: {
    color: 'white',
    fontSize: 18,
    flex: 1,
  },
  button: {
    backgroundColor: '#27ae60',
    borderRadius: 50,
    padding: 10,
  },
  disabledButton: {
    backgroundColor: '#7f8c8d', // ✅ Changes color when disabled
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressText: {
    marginTop: 10,
    color: 'white',
    fontSize: 14,
    marginLeft: 10,
  },
});
