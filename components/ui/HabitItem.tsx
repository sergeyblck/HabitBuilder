import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ProgressWheel from './ProgressWheel';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from "firebase/firestore";
import { onAuthStateChanged, getAuth, User } from 'firebase/auth';
import { firestore } from '@/services/Firebase';

export default function HabitItem({
  habit,
  habitType,
  onComplete,
  onUpdateCompletedToday,
  onStartStopwatch,
}: {
  habit: any;
  habitType: string;
  onComplete: (habitId: string, isCompletedToday: boolean) => void;
  onUpdateCompletedToday: (habitId: string, op: 'inc' | 'dec') => void;
  onStartStopwatch: (habit: any) => void;
}) {

  const today = new Date().toISOString().split("T")[0];
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [showStopwatchModal, setShowStopwatchModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  const router = useRouter();
  const backgroundColor = habit.backgroundColor;
  useEffect(() => {
    // Set completedToday based on how many times today's date is in completedDays
    setIsCompletedToday(habit.isCompleted);
    setCompletedToday(habit.completed);
  }, [habit.isCompleted, habit.completed, today]);

  const totalSeconds = (habit.duration?.hours ?? 0) * 3600 +
    (habit.duration?.minutes ?? 0) * 60 +
    (habit.duration?.seconds ?? 0);
  const hasValidDuration = habit.duration && totalSeconds >= 1 && totalSeconds <= 5400;
  const reached70Percent = elapsedTime >= Math.floor(totalSeconds * 0.7);

  const handlePress = () => {
    if (habit.tries === 1) {
      onComplete(habit.id, isCompletedToday);
    } else {
      // Handle the case where tries > 1, so we can adjust completedToday
      if (completedToday === habit.tries) {
        onComplete(habit.id, isCompletedToday);
      }
    }
  };
  const getProgressColor = () => {
    if (completedToday === habit.tries) {
      return { color: habitType === 'bad_habits' ? '#c0392b' : '#27ae60' }; // red for bad, green for good
    } else if (completedToday < habit.tries) {
      return { color: habitType === 'bad_habits' ? '#f39c12' : '#333' }; // gold or dark
    } else {
      return { color: habitType === 'bad_habits' ? '#000' : '#DAA520' }; // black or gold
    }
  };

  const incrementCompletedToday = () => {
    onUpdateCompletedToday(habit.id, 'inc');
  };

  const decrementCompletedToday = () => {
    if (completedToday > 0) {
      onUpdateCompletedToday(habit.id, 'dec');
    }
  };

  const navigateToHabitInfo = () => {
    router.push({
      pathname: '../HabitInfo',
      params: { habit: JSON.stringify(habit), habitType }
    });
  };

  const startStopwatch = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const pauseStopwatch = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const resetStopwatch = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setElapsedTime(0);
    setIsRunning(false);
    setShowStopwatchModal(false);
  };

  const finishStopwatch = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setShowStopwatchModal(false);
    if (habit.tries > 1) onUpdateCompletedToday(habit.id, 'inc');
    else onComplete(habit.id, isCompletedToday);
  };


  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Motivational Text with border and background */}

      <View style={styles.row}>

        <View style={styles.nameContainer}>
          <ProgressWheel progress={habit.streak / habit.goal} streak={habit.streak} goal={habit.goal} />

          <Pressable onPress={navigateToHabitInfo}>
            <Text style={styles.text}>{habit.name}</Text>
          </Pressable>
        </View>
        {habit.tries > 1 ? (
          <View style={styles.triesStyledContainer}>
            {habitType !== 'bad_habits' && hasValidDuration ? (
              <Pressable
              onPress={() => onStartStopwatch(habit)}

                style={[styles.doneContainer, { paddingHorizontal: 24 }]}
              >
                <Text style={styles.doneText}>⏱ Start</Text>
              </Pressable>
            ) : (
              <View style={styles.triesButtonsRow}>
                <Pressable onPress={decrementCompletedToday} style={[styles.smallButton]}>
                  <Ionicons name="remove" size={16} color='#007AFF' />
                </Pressable>

                <Pressable
                  onPress={incrementCompletedToday}
                  style={[
                    styles.smallButton,
                    habitType === 'bad_habits' && { backgroundColor: '#fdecea' },
                  ]}
                >
                  <Ionicons name="add" size={16} color={habitType === 'bad_habits' ? '#c0392b' : '#007AFF'} />
                </Pressable>
              </View>
            )}
            <Text style={[styles.triesStyledText, getProgressColor()]}>
              {completedToday} / {habit.tries}
            </Text>
          </View>

        ) : (
          habitType !== 'bad_habits' && hasValidDuration ? (
            <Pressable
            onPress={() => onStartStopwatch(habit)}

              style={[styles.doneContainer, { paddingHorizontal: 24 }]}
            >
              <Text style={styles.doneText}>⏱ Start</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handlePress}
              style={[
                styles.doneContainer,
                habitType === 'bad_habits' && {
                  backgroundColor: isCompletedToday ? '#e6f0ff' : '#fdecea',
                }
              ]}
            >
              <View style={styles.doneContent}>
                <Text style={[
                  styles.doneText,
                  habitType === 'bad_habits'
                    ? isCompletedToday
                      ? { color: '#007AFF' }
                      : { color: '#c0392b' }
                    : { color: '#007AFF' }
                ]}>
                  {habitType === 'bad_habits'
                    ? isCompletedToday
                      ? 'Undo'
                      : 'Did It 😞'
                    : isCompletedToday
                      ? 'Undo'
                      : 'Done'}
                </Text>

                <Ionicons
                  name={
                    habitType === 'bad_habits'
                      ? isCompletedToday ? 'checkmark' : 'close'
                      : isCompletedToday ? 'close' : 'checkmark'
                  }
                  size={16}
                  color={
                    habitType === 'bad_habits'
                      ? isCompletedToday ? '#007AFF' : '#c0392b'
                      : '#007AFF'
                  }
                  style={{ marginLeft: 4 }}
                />
              </View>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    width: '100%',
    borderBottomWidth: 1, // Add bottom border
    borderColor: '#ccc', // Set border color
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  text: {
    marginLeft: 10,
    marginTop: 20,
    color: 'black',
    fontSize: 18,
    flex: 1,
  },
  doneContainer: {
    backgroundColor: '#e6f0ff',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },

  doneContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  doneText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '700',
  },

  undoneContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  undoneText: {
    color: '#7f8c8d',
    fontSize: 15,
    fontWeight: '600',
  },
  triesStyledContainer: {
    alignItems: 'center',
  },

  triesButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  smallButton: {
    backgroundColor: '#e6f0ff',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  triesStyledText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  

});
