import { View, Text, TextInput, Button, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DestroyHabitsContext } from '@/context/DestroyHabitsContext';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function SetDestroyHabit() {
  const [habit, setHabit] = useState('');
  const [goal, setGoal] = useState('');
  const [reward, setReward] = useState('');
  const [tries, setTries] = useState(1);
  const [label, setLabel] = useState('');
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

  const { habit: habitData } = useLocalSearchParams();
  useEffect(() => {
    if (habitData) {
      const habitObj = JSON.parse(habitData as string); // Parse habit data
      setHabit(habitObj.name);
      setTries(Number(habitObj.tries)); 
      // Convert Firestore Timestamp to Date objects
      setTimes(
        habitObj.times.map((time: any) => new Date(time.seconds * 1000)) // Convert seconds to milliseconds
      );
      setLabel(habitObj.label);
      console.log(times);
    }
    else{
      setLabel("Enter amount of tries:");
    }
  }, [habitData]);

  // Update times when tries are changed
  useEffect(() => {
    const newTimes = new Array(tries).fill(new Date());
    setTimes(newTimes);
  }, [tries]);
  console.log(times);

  const [loading, setLoading] = useState(false);

  const handleSaveHabit = async () => {
    const trimmedHabit = habit.trim();
    const trimmedGoal = Number(goal);

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

    setLoading(true); 

    try {
      await addHabit(trimmedHabit, trimmedGoal, reward.trim(), tries, times);

      setHabit('');
      setGoal('');
      setReward('');
      setTries(1);
      setTimes([]);

      router.back();
    } catch (error) {
      console.error("Error saving habit:", error);
      alert("Failed to save habit. Please try again.");
    } finally {
      setLoading(false); 
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime: Date | undefined, index: number) => {
    if (selectedTime) {
      const newTimes = [...times];
      newTimes[index] = selectedTime;
      setTimes(newTimes);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format as HH:MM
  };

  const renderTimeRows = () => {
    const rows: JSX.Element[] = []; // Explicitly define the type as JSX.Element[]
    const chunkedTimes = [];
  
    for (let i = 0; i < times.length; i += 3) {
      chunkedTimes.push(times.slice(i, i + 3));
    }
  
    chunkedTimes.forEach((row, rowIndex) => {
      rows.push(
        <View key={rowIndex} style={styles.timeRow}>
          {row.map((time, index) => (
            <View key={index} style={styles.timeContainer}>
              <DateTimePicker
                value={time || new Date()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, rowIndex * 3 + index)}
              />
            <Text style={styles.timeText}>Try{(rowIndex*3)+(index+1)}</Text>
            </View>
          ))}
        </View>
      );
    });
  
    return rows;
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

        <Text style={styles.label}>{label}</Text>
        <TextInput
          placeholder="Enter number of tries"
          keyboardType="numeric"
          value={tries.toString()}
          onChangeText={text => setTries(Number(text))}
          style={styles.input}
          placeholderTextColor="#aaa"
        />

        {renderTimeRows()}

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
    marginTop: 50,
    justifyContent: 'flex-start', 
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
    marginBottom: 30,
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
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeContainer: {
    width: '30%',
  },
  timeText: {
    fontSize: 14,
    marginLeft: 30,
    marginTop: 5,
    color: '#333',
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
