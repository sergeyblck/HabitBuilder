import { View, Text, Button, StyleSheet, Modal, TextInput, Animated, Easing, ScrollView } from 'react-native';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import HabitList from '@/components/ui/HabitList';
import { firestore } from '@/services/Firebase';
import { BuildHabitsContext } from '@/context/BuildHabitsContext';
import { onAuthStateChanged, getAuth, User } from 'firebase/auth';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AddDefaultHabits } from '@/utils/AddDefaultHabits';
import { Pressable } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useRef } from 'react';
import { signOut } from 'firebase/auth';


const HABIT_COLLECTION = 'good_habits';
export default function index() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewGoalModalVisible, setIsNewGoalModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newReward, setNewReward] = useState('');
  const [habitId, setHabitId] = useState('');
  const [goal, setGoal] = useState(0);
  const [congratsAnimation] = useState(new Animated.Value(0));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendarRef = useRef<ScrollView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'alphabetical' | 'tries' | 'done' | 'not_done'>('all');
  const [stopwatchHabit, setStopwatchHabit] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('../LoginScreen');
      }
    });

    return () => unsubscribe();
  }, [router]);


  const habitsContext = useContext(BuildHabitsContext);
  const today = new Date().toISOString().split('T')[0];

  if (!habitsContext) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }
  const handleAddPrebuiltHabits = async () => {
    console.log("Here");
    await AddDefaultHabits();
  };
  useEffect(() => {
    // Scroll to the end of the calendar after mount
    setTimeout(() => {
      calendarRef.current?.scrollToEnd({ animated: false });
    }, 0);
  }, []);

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
      .getDate()
      .toString()
      .padStart(2, '0')}`;

  const handleComplete = async (habitId: string, isCompletedToday: boolean) => {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error("User is not authenticated");

      const habitRef = doc(firestore, `users/${user.uid}/${HABIT_COLLECTION}`, habitId);
      const habitDoc = await getDoc(habitRef);
      if (!habitDoc.exists()) throw new Error("Habit not found");
      const habitData = habitDoc.data();
      const today = new Date();
      const dateStr = formatDate(selectedDate);
      const todayStr = formatDate(today);

      const log = habitData.log || {};
      const logEntry = log[dateStr] || {
        completed: 0,
        tries: habitData.tries ?? 1,
        goal: habitData.goal ?? 0,
        streak: habitData.streak ?? 0,
        isCompleted: false,
      };

      const newStreak = isCompletedToday
        ? Math.max((logEntry.streak ?? 0) - 1, 0)
        : (logEntry.streak ?? 0) + 1;

      const updatePayload: any = {
        [`log.${dateStr}.isCompleted`]: !isCompletedToday,
        [`log.${dateStr}.streak`]: newStreak,
        [`log.${dateStr}.goal`]: logEntry.goal,
        [`log.${dateStr}.tries`]: logEntry.tries,
        [`log.${dateStr}.completed`]: logEntry.completed,
      };
      if (logEntry.tries == 1) {
        updatePayload.totalDone = (habitData.totalDone ?? 0) + (isCompletedToday ? -1 : 1);
      }

      await updateDoc(habitRef, updatePayload);
      console.log("Habit completion toggled successfully for", dateStr, updatePayload);

      // If dateStr is not today, propagate streak forward
      if (dateStr !== todayStr) {
        let currentDate = new Date(dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
        while (currentDate <= today) {
          const currentStr = formatDate(currentDate);

          const existingLog = log[currentStr];
          const previousStr = new Date(currentDate);
          previousStr.setDate(previousStr.getDate() - 1);
          const prevStr = formatDate(previousStr);
          const prevLog = log[prevStr] || logEntry;

          if (!existingLog) {
            const cloned = {
              goal: prevLog.goal,
              tries: prevLog.tries,
              streak: prevLog.streak,
              completed: 0,
              isCompleted: false,
            };
            await updateDoc(habitRef, {
              [`log.${currentStr}`]: cloned,
            });
          } else {
            let newStreak = existingLog.streak;
            if (newStreak >= prevLog.streak && newStreak < existingLog.goal) {
              if (!isCompletedToday) { newStreak = newStreak + 1; }
              else { newStreak = newStreak - 1; }
            }

            await updateDoc(habitRef, {
              [`log.${currentStr}.streak`]: newStreak,
            });
            console.log("Habit completion toggled successfully for", currentStr, newStreak);
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // Trigger modal only if today’s streak == goal
      const todayLog = habitData.log?.[todayStr];
      if (!isCompletedToday && todayLog?.streak + 1 === todayLog?.goal) {
        setHabitId(habitId);
        setGoal(todayLog.goal);
        setIsModalVisible(true);

        Animated.timing(congratsAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  };



  const handleUpdateCompletedToday = async (habitId: string, op: 'inc' | 'dec') => {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error("User is not authenticated");

      const selectedDateStr = selectedDate.toISOString().split("T")[0];
      const habitRef = doc(firestore, `users/${user.uid}/${HABIT_COLLECTION}`, habitId);
      const habitSnap = await getDoc(habitRef);
      if (!habitSnap.exists()) throw new Error("Habit not found");

      const data = habitSnap.data();
      const log = data.log || {};
      const current = log[selectedDateStr] || {
        completed: 0,
        isCompleted: false,
        streak: 0,
        goal: data.goal ?? 0,
        tries: data.tries ?? 1,
      };

      const updatedCompleted =
        op === 'inc' ? current.completed + 1 : Math.max(current.completed - 1, 0);
      const isCompleted = updatedCompleted >= current.tries;

      const totalDoneChange = op === 'inc' ? 1 : -1;
      const newTotalDone = (data.totalDone ?? 0) + totalDoneChange;

      const updatePayload = {
        [`log.${selectedDateStr}.completed`]: updatedCompleted,
        [`log.${selectedDateStr}.isCompleted`]: isCompleted,
        [`log.${selectedDateStr}.goal`]: current.goal,
        [`log.${selectedDateStr}.tries`]: current.tries,
        [`log.${selectedDateStr}.streak`]: current.streak,
        totalDone: newTotalDone,
      };


      await updateDoc(habitRef, updatePayload);
      console.log("Habit updated for", selectedDateStr, updatePayload);

      // Call onComplete only if just completed the final try
      if (op === 'inc' && updatedCompleted === current.tries) {
        handleComplete(habitId, false);
      } else if (op === 'dec' && updatedCompleted === current.tries - 1) {
        handleComplete(habitId, true);
      }

    } catch (error) {
      console.error("Error updating completed count:", error);
    }
  };



  const handleReset = async (habitId: string) => {
    const user = getAuth().currentUser;
    if (!user) throw new Error("User is not authenticated");

    const habitRef = doc(firestore, `users/${user.uid}/${HABIT_COLLECTION}`, habitId);
    const dateStr = selectedDate.toISOString().split("T")[0];

    try {
      const habitDoc = await getDoc(habitRef);
      if (!habitDoc.exists()) throw new Error("Habit not found");

      const habitData = habitDoc.data();
      const log = habitData.log || {};
      const logEntry = log[dateStr] || {};

      const updatedStreak = Math.max((logEntry.streak ?? 1) - 1, 0);
      const updatedCompleted = Math.max((logEntry.completed - 1), 0);

      const resetPayload = {
        [`log.${dateStr}.isCompleted`]: false,
        [`log.${dateStr}.completed`]: updatedCompleted,
        [`log.${dateStr}.streak`]: updatedStreak,
        [`log.${dateStr}.tries`]: logEntry.tries ?? habitData.tries ?? 1,
        [`log.${dateStr}.goal`]: logEntry.goal ?? habitData.goal ?? 0,
        totalDone: habitData.totalDone - 1,
      };

      await updateDoc(habitRef, resetPayload);

      setIsModalVisible(false);
      console.log("Habit reset for", dateStr);
    } catch (error) {
      console.error("Error resetting habit:", error);
    }
  };

  const handleSetNewGoal = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const habitRef = doc(firestore, `users/${user.uid}/${HABIT_COLLECTION}`, habitId);
    const dateStr = new Date().toISOString().split("T")[0];

    try {
      const habitSnap = await getDoc(habitRef);
      if (!habitSnap.exists()) {
        throw new Error("Habit not found");
      }

      const habitData = habitSnap.data();
      const existingCompleted = habitData?.log?.[dateStr]?.completed ?? 0;

      await updateDoc(habitRef, {
        reward: newReward,
        goalsAchieved: habitData.goalsAchieved + 1,
        [`log.${dateStr}.goal`]: parseInt(newGoal),
        [`log.${dateStr}.streak`]: 1,
        [`log.${dateStr}.isCompleted`]: true,
        [`log.${dateStr}.completed`]: existingCompleted,
      });

      setIsModalVisible(false);
      setIsNewGoalModalVisible(false);

      console.log("New goal and reward set successfully!");
    } catch (error) {
      console.error("Error setting new goal:", error);
    }
  };


  const maybeCloneLogForSelectedDate = async (habit: any, selectedDate: Date) => {
    const selectedDateStr = selectedDate.toISOString().split("T")[0];
    const createdDate = new Date(habit.createdAt);
    if (selectedDate < createdDate) return null;

    const log = habit.log || {};
    if (log[selectedDateStr]) return null;

    const previousDates = Object.keys(log).filter(date => new Date(date) < selectedDate);
    if (previousDates.length === 0) return null;

    const latestDate = previousDates.sort().reverse()[0];
    const base = log[latestDate];

    const newLogEntry = {
      goal: base.goal,
      tries: base.tries,
      streak: base.streak,
      completed: 0,
      isCompleted: false,
    };

    const user = getAuth().currentUser;
    if (!user) return;

    const habitRef = doc(firestore, `users/${user.uid}/${HABIT_COLLECTION}`, habit.id);
    await updateDoc(habitRef, {
      [`log.${selectedDateStr}`]: newLogEntry,
    });

    console.log(`Copied log to ${selectedDateStr} for habit ${habit.name}`);
  };


  const filteredHabits = () => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const filtered = habitsContext.habits;

    const relevantHabits = filtered.filter(habit => {
      const createdDate = new Date(habit.createdAt);
      return selectedDate >= createdDate;
    });

    // Trigger log creation if missing
    relevantHabits.forEach(habit => {
      maybeCloneLogForSelectedDate(habit, selectedDate);
    });

    const transformed = relevantHabits.map(habit => {
      const logEntry = habit.log?.[selectedDateStr];

      return {
        ...habit,
        goal: logEntry?.goal ?? 0,
        tries: logEntry?.tries ?? 1,
        streak: logEntry?.streak ?? 0,
        completed: logEntry?.completed ?? 0,
        isCompleted: logEntry?.isCompleted ?? false,
        dateUsed: selectedDateStr,
      };
    });

    let result = transformed;
    if (searchQuery.trim()) {
      result = result.filter(habit =>
        habit.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (filterType) {
      case 'alphabetical':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'tries':
        result = [...result].sort((a, b) => b.tries - a.tries);
        break;
      case 'done':
        result = result.filter(h => h.isCompleted);
        break;
      case 'not_done':
        result = result.filter(h => !h.isCompleted);
        break;
    }

    return result;
  };



  const generatePastWeek = () => {
    const days = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };
  const [showStopwatchModal, setShowStopwatchModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = (stopwatchHabit?.duration?.hours ?? 0) * 3600 +
    (stopwatchHabit?.duration?.minutes ?? 0) * 60 +
    (stopwatchHabit?.duration?.seconds ?? 0);

  const reached70Percent = elapsedTime >= Math.floor(totalSeconds * 0.7);

  const startStopwatch = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
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
    setStopwatchHabit(null);
  };

  const finishStopwatch = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setElapsedTime(0);
    setShowStopwatchModal(false);
    setStopwatchHabit(null);
    if (stopwatchHabit?.tries > 1) handleUpdateCompletedToday(stopwatchHabit.id, 'inc');
    else handleComplete(stopwatchHabit.id, false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.smallHeader}>Good Habits</Text>
      <View style={styles.calendarWrapper}>
        <ScrollView
          ref={calendarRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarRow}
        >
          {generatePastWeek().map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  isSelected && styles.calendarDaySelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.calendarDayText, isSelected && { color: '#fff' }]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.calendarDateNumber,
                  isToday && { fontWeight: 'bold' },
                  isSelected && { color: '#fff' },
                ]}>

                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>


      <View style={styles.searchFilterRow}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search habits..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const next: any = {
              all: 'alphabetical',
              alphabetical: 'tries',
              tries: 'done',
              done: 'not_done',
              not_done: 'all',
            };
            setFilterType(prev => next[prev]);
          }}
        >
          <Text style={styles.filterButtonText}>
            {filterType === 'all' ? 'All' :
              filterType === 'alphabetical' ? 'A–Z' :
                filterType === 'tries' ? 'Tries' :
                  filterType === 'done' ? 'Done' : 'Not Done'}
          </Text>
        </TouchableOpacity>
      </View>


      <View style={styles.listWrapper}>
        <HabitList
          habits={filteredHabits()}
          habitType={HABIT_COLLECTION}
          onComplete={handleComplete}
          onUpdateCompletedToday={handleUpdateCompletedToday}
          onStartStopwatch={(habit) => {
            setStopwatchHabit(habit);
            setShowStopwatchModal(true);
          }}
        />

      </View>

      <Pressable style={styles.floatingButton} onPress={() => router.push('../SetDefaultGoodHabits')}>
        <Text style={styles.floatingButtonText}>+ New Habit</Text>
      </Pressable>


      <Modal visible={isModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.cardModal}>

              <ConfettiCannon
                count={200}
                origin={{ x: 0.5, y: 0 }}
                fadeOut={true}
                fallSpeed={2500}
              />

              {/* Medal Icon */}
              <Text style={styles.emoji}>🏆</Text>

              {/* Congrats Text */}
              <Animated.Text style={[styles.modalTitle, { opacity: congratsAnimation }]}>
                Congratulations!
              </Animated.Text>

              <Text style={styles.modalSubtitle}>You’ve crushed your goal 🎯</Text>

              {/* Reward Section */}
              <View style={styles.rewardContainer}>
                <Text style={styles.rewardLabel}>Your Reward</Text>
                <Text style={styles.rewardBigText}>
                  {habitsContext.habits.find(habit => habit.id === habitId)?.reward || "🎁"}
                </Text>
              </View>

              {/* Button Actions */}
              <View style={styles.modalButtonGroup}>
                <TouchableOpacity
                  style={[styles.modalButtonCompact, styles.borderButton]}
                  onPress={() => handleReset(habitId)}
                >
                  <Text style={[styles.modalButtonText, styles.borderButtonText]}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButtonCompact, styles.lightPrimary]}
                  onPress={() => {
                    setIsModalVisible(false);
                    setIsNewGoalModalVisible(true);
                  }}
                >
                  <Text style={styles.modalButtonText}>Set New Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>




      <Modal visible={isNewGoalModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.newGoalOverlay}>
            <View style={styles.newGoalCardModal}>
              <View style={styles.newGoalHeaderRow}>
                <Text style={styles.newGoalModalTitle}>New Goal for </Text>
                <Text style={styles.newGoalHabitName}>{habitsContext.habits.find(h => h.id === habitId)?.name || "Habit"}</Text>
                <Text style={styles.newGoalModalTitle}> Habit</Text>
              </View>

              <View style={styles.newGoalInlineRow}>
                <Text style={styles.newGoalCardLabel}>Goal (days)</Text>
                <TextInput
                  style={styles.newGoalInlineInput}
                  value={newGoal}
                  onChangeText={setNewGoal}
                  placeholder="e.g. 21"
                  keyboardType="numeric"
                  placeholderTextColor="#aaa"
                />
              </View>

              <View style={styles.newGoalCard}>
                <Text style={styles.newGoalCardLabel}>Reward</Text>
                <TextInput
                  style={styles.newGoalRewardInput}
                  value={newReward}
                  onChangeText={setNewReward}
                  placeholder="e.g. Buy ice cream, go to the cinema..."
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#aaa"
                />
              </View>

              <View style={styles.newGoalModalButtonGroup}>
                <TouchableOpacity
                  style={[styles.newGoalModalButtonCompact, styles.newGoalBorderButton]}
                  onPress={() => {
                    handleReset(habitId);
                    setIsNewGoalModalVisible(false);
                  }}
                >
                  <Text style={[styles.newGoalModalButtonText, styles.newGoalBorderButtonText]}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.newGoalModalButtonCompact, styles.newGoalPrimary]} onPress={handleSetNewGoal}>
                  <Text style={styles.newGoalModalButtonText}>Save Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {stopwatchHabit && showStopwatchModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.stopwatchCard}>
            <Text style={styles.stopwatchEmoji}>⏱️</Text>
            <Text style={styles.elapsedLabel}>Elapsed</Text>

            <Text style={styles.elapsedTime}>
              {String(Math.floor(elapsedTime / 3600)).padStart(2, '0')}:
              {String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0')}:
              {String(elapsedTime % 60).padStart(2, '0')}
            </Text>

            <Text style={styles.goalTimeLabel}>
              Goal: {String(Math.floor(totalSeconds / 3600)).padStart(2, '0')}:
              {String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')}:
              {String(totalSeconds % 60).padStart(2, '0')}
            </Text>

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={[styles.modalButtonCompact, styles.borderButton]}
                onPress={resetStopwatch}
              >
                <Text style={[styles.modalButtonText, styles.borderButtonText]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButtonCompact, styles.lightPrimary]}
                onPress={isRunning ? pauseStopwatch : startStopwatch}
              >
                <Text style={styles.modalButtonText}>{isRunning ? 'Pause' : 'Start'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButtonCompact,
                  reached70Percent ? styles.primary : styles.disabledButton,
                ]}
                disabled={!reached70Percent}
                onPress={finishStopwatch}
              >
                <Text style={styles.modalButtonText}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingTop: 20,
    position: 'relative',
  },
  smallHeader: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingBottom: 20,
  },

  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },

  searchBox: {
    flex: 1,
    backgroundColor: '#e6f0ff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  searchInput: {
    fontSize: 14,
    color: '#333',
  },

  filterButton: {
    backgroundColor: '#e6f0ff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  listWrapper: {
    flex: 1,
    width: '100%',
    marginBottom: 70,
  },

  header: {
    marginTop: 40,
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 2,
    borderColor: '#ccc',
    alignSelf: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWrapper: {
    borderBottomWidth: 1,
    borderColor: '#f0f4ff',
    paddingBottom: 5,
    width: '100%',
    marginBottom: 25,
    paddingRight: 8,
  },

  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  calendarDay: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    width: 55,
  },

  calendarDaySelected: {
    backgroundColor: '#007AFF',
  },

  calendarDayText: {
    fontSize: 12,
    color: '#555',
  },

  calendarDateNumber: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },


  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#e6f0ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  floatingButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent dark background
  },
  modalContent: {
    marginTop: 250,
    width: '80%',
    padding: 30,
    backgroundColor: '#ffffff', // White background for the modal
    borderRadius: 12,
    elevation: 8,  // Subtle shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',  // Dark gray text for professional look
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',  // Slightly lighter gray for subtext
    marginVertical: 10,
    textAlign: 'center',
  },
  cheeringText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#555',  // Lighter gray to maintain professional vibe
    textAlign: 'center',
    marginVertical: 10,
  },
  input: {
    width: '100%',
    height: 45,
    paddingHorizontal: 15,
    marginVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',  // Light gray border for the input fields
    borderRadius: 8,
    backgroundColor: '#f9f9f9',  // Light background for input fields
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 10,
  },
  resetButton: {
    backgroundColor: '#e74c3c', // Red for the reset action
  },
  saveButton: {
    backgroundColor: '#2d8eff', // Blue for the save action
  }, overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardModal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },

  primary: {
    backgroundColor: '#007AFF',
  },

  danger: {
    backgroundColor: '#FF3B30',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 35,
  },

  rewardContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },

  rewardLabel: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  rewardBigText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#007AFF',
    textAlign: 'center',
  },

  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },

  modalButtonCompact: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  // Reset button soft border
  borderButton: {
    borderWidth: 1.5,
    borderColor: '#e57373', // muted red
    backgroundColor: 'transparent',
    opacity: 0.85,
  },

  borderButtonText: {
    color: '#e57373',
    fontSize: 13,
    fontWeight: '500',
  },

  // Saturated light blue + elevation
  lightPrimary: {
    backgroundColor: '#4FA3FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Optional: more crisp modalButtonText
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },


  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  newGoalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  newGoalCardModal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center',
  },

  newGoalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 30,
    marginTop: 10,
  },

  newGoalModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  newGoalHabitName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#007AFF',
  },

  newGoalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  newGoalCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 2,
  },

  newGoalInput: {
    backgroundColor: '#e6f0ff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },

  newGoalRewardInput: {
    marginTop: 8,
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

  newGoalModalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    marginTop: 10,
  },

  newGoalModalButtonCompact: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  newGoalModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  newGoalPrimary: {
    backgroundColor: '#4FA3FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  newGoalBorderButton: {
    borderWidth: 1.5,
    borderColor: '#e57373',
    backgroundColor: 'transparent',
    opacity: 0.85,
  },

  newGoalBorderButtonText: {
    color: '#e57373',
    fontSize: 13,
    fontWeight: '500',
  },
  newGoalInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  newGoalInlineInput: {
    backgroundColor: '#e6f0ff',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: '#333',
    width: '45%',
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },


  stopwatchModal: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',

    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,

    // Shadow for Android
    elevation: 10,
  },

  timerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  stopwatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
    gap: 10,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stopwatchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
  },

  stopwatchElapsed: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },

  goalLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 20,
  },

  stopwatchRed: {
    backgroundColor: '#FF3B30',
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  stopwatchBlue: {
    backgroundColor: '#4FA3FF',
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  stopwatchPrimary: {
    backgroundColor: '#007AFF',
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  stopwatchDisabled: {
    backgroundColor: '#ccc',
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stopwatchCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center',
  },
  
  stopwatchEmoji: {
    fontSize: 42,
    marginBottom: 8,
  },
  
  elapsedLabel: {
    fontSize: 13,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  elapsedTime: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
    marginVertical: 6,
  },
  
  goalTimeLabel: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 24,
  },
  
  disabledButton: {
    backgroundColor: '#ccc',
  },
  
});


