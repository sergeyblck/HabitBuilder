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


export default function BuildHabit() {
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
  

  const handleComplete = async (habitId: string, isCompletedToday: boolean) => {
    try {
      //handleAddPrebuiltHabits();
      const user = getAuth().currentUser;
      if (!user) throw new Error("User is not authenticated");
  
      const habitRef = doc(firestore, `users/${user.uid}/good_habits`, habitId);
  
      const habitDoc = await getDoc(habitRef);
      if (!habitDoc.exists()) throw new Error("Habit not found");
  
      const habitData = habitDoc.data();
      const currentStreak = habitData?.streak ?? 0;
      const goal = habitData?.goal ?? 0;
  
      // Show modal before updating if goal will be reached
      if (!isCompletedToday && currentStreak + 1 === goal) {
        setHabitId(habitId); // Set habitId correctly here
        setGoal(goal);
        setIsModalVisible(true);
      
        
        Animated.timing(congratsAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }).start();
      }
  
      // Proceed with the actual update
      await updateDoc(habitRef, {
        completedDays: isCompletedToday ? arrayRemove(today) : arrayUnion(today),
        streak: increment(isCompletedToday ? -1 : 1),
      });

  
      console.log("Habit completion toggled successfully!");
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  };
  
 
  const handleReset = async (habitId: string) => {
    const user = getAuth().currentUser;
    if (!user) throw new Error("User is not authenticated");
  
    const habitRef = doc(firestore, `users/${user.uid}/good_habits`, habitId);
    const today = new Date().toISOString().split("T")[0];
  
    try {
      // Remove today's date from completedDays and decrement the streak by 1
      await updateDoc(habitRef, {
        completedDays: arrayRemove(today),
        streak: increment(-1),
      });
  
      // Close the modal after resetting
      setIsModalVisible(false);
      console.log("Action has been reset to the previous state.");
    } catch (error) {
      console.error("Error resetting habit:", error);
    }
  };
  
  
  

  const handleSetNewGoal = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }
  
    const habitRef = doc(firestore, `users/${user.uid}/good_habits`, habitId);
    await updateDoc(habitRef, {
      goal: parseInt(newGoal),
      reward: newReward,
      streak: 1,
      completedDays: arrayUnion(new Date().toISOString().split("T")[0]),
    });
  
    // Close the current modal first before opening the new one
    setIsModalVisible(false); // Close the first modal
    setIsNewGoalModalVisible(false); // Open the new goal modal
  
    console.log("New goal and reward set successfully!");
  };

  const filteredHabits = () => {
    let filtered = habitsContext.habits;
  
    if (searchQuery.trim()) {
      filtered = filtered.filter(habit =>
        habit.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  
    switch (filterType) {
      case 'alphabetical':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'tries':
        filtered = [...filtered].sort((a, b) => b.tries - a.tries);
        break;
      case 'done':
        filtered = filtered.filter(habit =>
          habit.completedDays?.some((d: any) => {
            const dateStr = d instanceof Date ? d.toISOString().split('T')[0] : d;
            return dateStr === today;
          })
        );
        break;
      
      case 'not_done':
        filtered = filtered.filter(habit =>
          !habit.completedDays?.some((d: any) => {
            const dateStr = d instanceof Date ? d.toISOString().split('T')[0] : d;
            return dateStr === today;
          })
        );
        break;
      default:
        break;
    }
  
    return filtered;
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
          habitType="good_habits" 
          onComplete={handleComplete} 
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
    marginBottom: 150,
  },
  
  header: {
    marginTop: 40,
    fontSize: 22,
    fontWeight: '600',
    color: '#333',  
    borderBottomWidth:2,
    borderColor: '#ccc',
    alignSelf:'center',
    justifyContent:'center',
    textAlign:'center',
    width: '100%',
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWrapper: {
    borderBottomWidth:1,
    borderColor:'#f0f4ff',
    paddingBottom:5,
    width: '100%',
    marginBottom: 25,
    paddingRight:10,
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
    bottom: 100,
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
  },overlay: {
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
    marginTop:10,
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
    marginLeft:2,
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
  
});

  
