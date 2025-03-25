import { View, Text, TextInput, Button, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useContext } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DestroyHabitsContext } from '@/context/DestroyHabitsContext';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

export default function SetDestroyHabit() {
  const [habit, setHabit] = useState('');
  const [goal, setGoal] = useState('');
  const [reward, setReward] = useState('');
  const [tries, setTries] = useState(1);
  const [times, setTimes] = useState<Date[]>([]);
  const habitsContext = useContext(DestroyHabitsContext);
  const router = useRouter(); 

  if (!habitsContext) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const { addHabit } = habitsContext;

  const [loading, setLoading] = useState(false);

  const handleSaveHabit = async () => {
    // Trimmed values to prevent accidental spaces
    const trimmedHabit = habit.trim();
    const trimmedGoal = Number(goal);

    // Validation checks
    if (!trimmedHabit) {
      alert("Habit name is required.");
      return;
    }
    if (!trimmedGoal || isNaN(Number(trimmedGoal)) || Number(trimmedGoal) <= 0) {
      alert("Please enter a valid goal (a positive number).");
      return;
    }
    if (isNaN(tries) || tries <= 0) {
      alert("Number of tries must be a positive number.");
      return;
    }
    if (times.length !== tries || times.some(time => !(time instanceof Date))) {
      alert("Please set a valid time for each try.");
      return;
    }

    setLoading(true); // Show loading state to prevent duplicate submissions

    try {
      await addHabit(trimmedHabit, trimmedGoal, reward.trim(), tries, times);

      // Reset form fields only after successful submission
      setHabit('');
      setGoal('');
      setReward('');
      setTries(1);
      setTimes([]);

      router.back(); // Navigate back to the previous screen
    } catch (error) {
      console.error("Error saving habit:", error);
      alert("Failed to save habit. Please try again.");
    } finally {
      setLoading(false); // Hide loading state after operation completes
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime: Date | undefined, index: number) => {
    if (selectedTime) {
      const newTimes = [...times];
      newTimes[index] = selectedTime;
      setTimes(newTimes);
    }
  };
  return (
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps='handled'>
        <Text style={styles.title}>New Habit</Text>

        <Text style={styles.label}>Habit Name</Text>
        <TextInput
          placeholder="Enter habit"
          value={habit}
          onChangeText={setHabit}
          style={styles.input}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Goal (Days)</Text>
        <TextInput
          placeholder="Enter number of days"
          keyboardType="numeric"
          value={goal}
          onChangeText={setGoal}
          style={styles.input}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Reward</Text>
        <TextInput
          placeholder="Enter reward"
          value={reward}
          onChangeText={setReward}
          style={styles.input}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Number of Tries</Text>
        <TextInput
          placeholder="Enter number of tries"
          keyboardType="numeric"
          value={tries.toString()}
          onChangeText={text => setTries(Number(text))}
          style={styles.input}
          placeholderTextColor="#aaa"
        />

        {Array.from({ length: tries }).map((_, index) => (
          <View key={index} style={styles.timeContainer}>
            <Text style={styles.label}>Try {index + 1} Time</Text>
            <DateTimePicker
              value={times[index] || new Date()}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, index)}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.5 }]}
          onPress={handleSaveHabit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "Save Habit"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',  // Change from 'center' to 'flex-start'
    alignItems: 'stretch',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    color: '#333',
  },
  timeContainer: {
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
