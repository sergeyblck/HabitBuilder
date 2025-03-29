import { View, Text, TextInput, Button, Modal, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BuildHabitsContext } from '@/context/BuildHabitsContext';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function SetHabit() {
  const [habit, setHabit] = useState('');
  const [goal, setGoal] = useState('');
  const [reward, setReward] = useState('');
  const [tries, setTries] = useState(1);
  const [label, setLabel] = useState('');
  const [times, setTimes] = useState<Date[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [notificationTimes, setNotificationTimes] = useState<Date[]>([]);
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  
  const habitsContext = useContext(BuildHabitsContext);
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
      const habitObj = JSON.parse(habitData as string);
      setHabit(habitObj.name);
      setTries(Number(habitObj.tries));
      setTimes(habitObj.times.map((time: any) => new Date(time.seconds * 1000)));
      setLabel(habitObj.label);
    } else {
      setLabel("Enter amount of tries:");
    }
  }, [habitData]);

  useEffect(() => {
    const newTimes = new Array(tries).fill(new Date());
    setTimes(newTimes);
  }, [tries]);

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

  return (
    <View style={styles.modalContainer}>
      <Text style={styles.title}>New Habit</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps='handled'>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Habit Name</Text>
          <TextInput
            placeholder="e.g., Meditate, Read, Walk"
            value={habit}
            onChangeText={setHabit}
            style={styles.input}
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.cardLabel}>Goal (days)</Text>
              <TextInput
                keyboardType="numeric"
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g. 21"
                style={styles.input}
                placeholderTextColor="#aaa"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.cardLabel}>Max Tries</Text>
              <TextInput
                keyboardType="numeric"
                value={tries.toString()}
                onChangeText={(text) => setTries(Number(text))}
                placeholder="e.g. 3"
                style={styles.input}
                placeholderTextColor="#aaa"
              />
            </View>
          </View>

          <Text style={styles.explanation}>
            Your goal is how many days you want to stick with this habit. “Max tries” is the number of attempts allowed per day.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Reward</Text>
          <TextInput
            placeholder="Describe how you'll reward yourself after achieving your goal..."
            value={reward}
            onChangeText={setReward}
            style={styles.rewardInput}
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.reminderRow}>
            <Text style={styles.cardLabel}>Reminders</Text>
            <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
          </View>
          {reminderEnabled && (
            <View style={styles.pillContainer}>
              {notificationTimes.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.timePill}
                  onPress={() => {
                    setSelectedTime(time);
                    setEditIndex(index);
                    setShowTimeModal(true);
                  }}
                >
                  <Text style={styles.timeText}>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.timePill}
                onPress={() => {
                  setSelectedTime(new Date());
                  setEditIndex(null);
                  setShowTimeModal(true);
                }}
              >
                <Text style={styles.addTime}>+ Add Time</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
        
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

      {showTimeModal && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPressOut={() => setShowTimeModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.timeModal}>
            <Text style={styles.cardLabel}>Select Time</Text>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                if (date) setSelectedTime(date);
              }}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  if (editIndex !== null) {
                    const updated = [...notificationTimes];
                    updated[editIndex] = selectedTime;
                    setNotificationTimes(updated);
                  } else {
                    setNotificationTimes([...notificationTimes, selectedTime]);
                  }
                  setShowTimeModal(false);
                }}
              >
                <Text style={styles.saveButtonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ff3b30' }]}
                onPress={() => {
                  if (editIndex !== null) {
                    const updated = [...notificationTimes];
                    updated.splice(editIndex, 1);
                    setNotificationTimes(updated);
                  }
                  setShowTimeModal(false);
                }}
              >
                <Text style={styles.saveButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#ffffff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  scrollContainer: {
    backgroundColor: "#ffffff",
    margin: 20,
    marginBottom: 20,
    borderRadius: 30,
    paddingTop: 30,
    paddingLeft: 20,
    paddingRight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#e6f0ff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  explanation: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  rewardInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  title: {
    marginTop: 70,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    marginBottom: 30,
    alignContent: "center",
    alignSelf: "center",
    backgroundColor: '#007AFF',
    borderRadius: 40,
    padding: 12,
    paddingLeft: 20,
    paddingRight: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  timePill: {
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 8,
    height: 32,
  },
  
  removeTime: {
    color: '#999',
    fontWeight: '600',
  },
  addTime: {
    color: '#007AFF',
    fontWeight: '600',
  },
  pickRingtone: {
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  timeModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalButton: {
    flex: 1,
    marginTop: 10,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  
});
