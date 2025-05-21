import { View, Text, TextInput, Button, Modal, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import React, { useState, useContext, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { BuildHabitsContext } from '@/context/BuildHabitsContext';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { registerForPushNotificationsAsync, scheduleNotificationForTime } from '@/services/Notifications';

export default function SetHabit() {
  const [habit, setHabit] = useState('');
  const [id, setId] = useState('');
  const [goal, setGoal] = useState('');
  const [reward, setReward] = useState('');
  const [tries, setTries] = useState(1);
  const [label, setLabel] = useState('');
  const [times, setTimes] = useState<Date[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [durationEnabled, setDurationEnabled] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [duration, setDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });




  const habitsContext = useContext(BuildHabitsContext);
  const router = useRouter();

  if (!habitsContext) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }
  const { addHabit, editHabit } = habitsContext;

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);


  const { habit: habitData, mode } = useLocalSearchParams();
  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (habitData) {
      const habitObj = JSON.parse(habitData as string);
      setId(habitObj.id);
      setHabit(habitObj.name);
      setTries(Number(habitObj.tries));
      setGoal(habitObj.goal ? habitObj.goal.toString() : '');
      setReward(habitObj.reward);

      const parsedTimes = habitObj.times.map((time: any) =>
        typeof time === 'string' ? new Date(time) : new Date(time.seconds * 1000)
      );
      setTimes(parsedTimes);

      setLabel(habitObj.label || "Amount of daily tries");
      if (habitObj.duration) {
        setDurationEnabled(true);
        setDuration({
          hours: habitObj.duration.hours || 0,
          minutes: habitObj.duration.minutes || 0,
          seconds: habitObj.duration.seconds || 0,
        });
      }

    } else {
      setLabel("Amount of daily tries");
    }
  }, [habitData]);

  const [loading, setLoading] = useState(false);

  const handleSaveHabit = async () => {
    const trimmedHabit = habit.trim();
    const trimmedGoal = Number(goal);

    if (!trimmedHabit) {
      alert("Habit name is required.");
      return;
    }
    if (!trimmedGoal || isNaN(trimmedGoal) || trimmedGoal <= 0) {
      alert("Please enter a valid goal (a positive number).");
      return;
    }
    if (isNaN(tries) || tries <= 0) {
      alert("Number of tries must be a positive number.");
      return;
    }
    if (reminderEnabled && times.length !== tries || times.some(time => !(time instanceof Date))) {
      alert("Please set a valid time for each try.");
      return;
    }
    if (
      durationEnabled &&
      (duration.hours === 0 && duration.minutes === 0 && duration.seconds === 0)
    ) {
      alert("Please enter a valid duration.");
      return;
    }

    setLoading(true);

    const totalDuration = durationEnabled
      ? {
        hours: Number(duration.hours) || 0,
        minutes: Number(duration.minutes) || 0,
        seconds: Number(duration.seconds) || 0,
      }
      : undefined;

    alert(duration.minutes);

    try {
      if (isEditMode) {
        await editHabit(id, trimmedHabit, trimmedGoal, (reward || '').trim(), tries, times, totalDuration);
      } else {
        await addHabit(trimmedHabit, trimmedGoal, (reward || '').trim(), tries, times, totalDuration);

      }
      
      if (reminderEnabled) {
        for (const time of times) {
          await scheduleNotificationForTime(
            time,
            `Reminder: ${trimmedHabit}`,
            `It's time to complete your habit: ${trimmedHabit}`
          );
        }
      }

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
      <Text style={styles.title}>{isEditMode ? 'Edit Habit' : 'New Habit'}</Text>

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
              <Text style={styles.cardLabel}>Goal</Text>
              <TextInput
                keyboardType="numeric"
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g. 21"
                style={styles.input}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.inputHint}>Days to succeed</Text>
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.cardLabel}>Attempts</Text>
              <TextInput
                keyboardType="numeric"
                value={tries === 0 ? '' : tries.toString()}
                onChangeText={(text) => {
                  const numeric = parseInt(text);
                  setTries(text === '' ? 0 : isNaN(numeric) ? 1 : numeric);
                }}
                onBlur={() => {
                  if (tries <= 0) setTries(1);
                }}
                placeholder="e.g. 3"
                style={styles.input}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.inputHint}>{label}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.durationCard]}>
          <View style={styles.durationRow}>
            <Text style={styles.durationCenterLabel}>Duration</Text>
            <TouchableOpacity
              style={styles.durationPill}
              onPress={() => setDurationModalVisible(true)}
            >
              <Text style={styles.addTime}>
                {(duration.hours || duration.minutes || duration.seconds)
                  ? `${duration.hours.toString().padStart(2, '0')}:${duration.minutes.toString().padStart(2, '0')}:${duration.seconds.toString().padStart(2, '0')}`
                  : '+ Add Time'}
              </Text>
            </TouchableOpacity>
          </View>
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
              {times.map((time, index) => (
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
              //display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                if (date) setSelectedTime(date);
              }}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  if (editIndex !== null) {
                    const updated = [...times];
                    updated[editIndex] = selectedTime;
                    setTimes(updated);
                  } else {
                    setTimes([...times, selectedTime]);
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
                    const updated = [...times];
                    updated.splice(editIndex, 1);
                    setTimes(updated);
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

      {durationModalVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPressOut={() => setDurationModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.durationModal}>
            <Text style={styles.cardLabel}>Set Duration</Text>

            <View style={styles.durationPickerRow}>
              <View style={styles.durationColumn}>
                <Text style={styles.durationLabel}>Hours</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={duration.hours.toString()}
                    onValueChange={(value) =>
                      setDuration({ ...duration, hours: parseInt(value) })
                    }
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <Picker.Item key={i} label={i.toString()} value={i.toString()} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.durationColumn}>
                <Text style={styles.durationLabel}>Minutes</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={duration.minutes.toString()}
                    onValueChange={(value) =>
                      setDuration({ ...duration, minutes: parseInt(value) })
                    }
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <Picker.Item key={i} label={i.toString()} value={i.toString()} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.durationColumn}>
                <Text style={styles.durationLabel}>Seconds</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={duration.seconds.toString()}
                    onValueChange={(value) =>
                      setDuration({ ...duration, seconds: parseInt(value) })
                    }
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <Picker.Item key={i} label={i.toString()} value={i.toString()} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setDurationEnabled(true);
                  setDurationModalVisible(false);
                }
                }
              >
                <Text style={styles.saveButtonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ff3b30' }]}
                onPress={() => {
                  setDuration({ hours: 0, minutes: 0, seconds: 0 });
                  setDurationModalVisible(false);
                  setDurationEnabled(false);
                }}
              >
                <Text style={styles.saveButtonText}>Clear</Text>
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
    backgroundColor: "#fff",
  },
  scrollContainer: {
    backgroundColor: "#fff",
    margin: 20,
    marginBottom: 20,
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
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
  },
  optionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  optionalInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginTop: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#333',
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
    marginTop: 60,
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
  durationModal: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },

  durationPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 10,
  },

  durationColumn: {
    flex: 1,
    alignItems: 'center',
  },

  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },

  pickerWrapper: {
    backgroundColor: '#f2f6ff',
    borderRadius: 12,
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  picker: {
    width: '100%',
    height: 120,
  },

  pickerItem: {
    fontSize: 20,
    height: 120,
    color: '#333',
  },

  durationCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 60,
    justifyContent: 'center',
  },

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  durationCenterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },

  durationPill: {
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },

});
