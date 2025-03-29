import { View, Text, Button, StyleSheet, Modal, TextInput, Animated, Easing } from 'react-native';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import HabitList from '@/components/ui/HabitList';
import { firestore } from '@/services/Firebase';
import { DestroyHabitsContext } from '@/context/DestroyHabitsContext';
import { onAuthStateChanged, getAuth, User } from 'firebase/auth'; 
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AddDefaultHabits } from '@/utils/AddDefaultHabits';


export default function DestroyHabit() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewGoalModalVisible, setIsNewGoalModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newReward, setNewReward] = useState('');
  const [habitId, setHabitId] = useState('');
  const [goal, setGoal] = useState(0);
  const [congratsAnimation] = useState(new Animated.Value(0));

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

  const habitsContext = useContext(DestroyHabitsContext);
  
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

  const handleComplete = async (habitId: string, isCompletedToday: boolean) => {
    try {
      handleAddPrebuiltHabits();
      const user = getAuth().currentUser;
      if (!user) throw new Error("User is not authenticated");
  
      const habitRef = doc(firestore, `users/${user.uid}/bad_habits`, habitId);
      const today = new Date().toISOString().split("T")[0];
  
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
  
    const habitRef = doc(firestore, `users/${user.uid}/bad_habits`, habitId);
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
  
    const habitRef = doc(firestore, `users/${user.uid}/bad_habits`, habitId);
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
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Destroying Habits</Text>

      <HabitList habits={habitsContext.habits} onComplete={handleComplete} />

      <Button title="Destroy a bad Habit" onPress={() => router.push('../SetDefaultBadHabits')} />

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
              <ConfettiCannon 
                count={200} 
                origin={{ x: 0.5, y: 0 }} 
                fadeOut={true} 
                fallSpeed={2500} 
              />
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Confetti Animation */}

              <Animated.Text style={[styles.congratsText, { opacity: congratsAnimation }]}>
                🎉 Congratulations!
              </Animated.Text>

              <Text style={styles.subText}>
                You achieved your goal!
              </Text>

              <Text style={styles.cheeringText}>Amazing! You did it! 🎉🎊</Text>

              {/* Reward */}
              <Text style={styles.rewardText}>
                Reward: {habitsContext.habits.find(habit => habit.id === habitId)?.reward}
              </Text>

              <View style={styles.buttonContainer}>
                <Button title="Reset" onPress={()=>handleReset(habitId)} color="#E74C3C" />
                <Button title="Set a New Goal" onPress={() => { setIsModalVisible(false); setIsNewGoalModalVisible(true); }} color="#3498DB" />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={isNewGoalModalVisible} transparent={true} animationType="slide">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set a New Goal</Text>

              <TextInput
                style={styles.input}
                value={newGoal}
                onChangeText={setNewGoal}
                placeholder="Enter goal in days"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={newReward}
                onChangeText={setNewReward}
                placeholder="Enter reward"
              />

              <View style={styles.buttonContainer}>
                <Button title="Reset" onPress={() => { handleReset(habitId); setIsNewGoalModalVisible(false); }} color="red" />
                <Button title="Save" onPress={handleSetNewGoal} color="blue" />
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7',  // Light gray background
  },
  header: {
    marginTop: 40,
    fontSize: 22,
    fontWeight: '600',
    color: '#333',  // Dark gray text
    marginBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  rewardText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d8eff', // A professional blue color for emphasis on the reward
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',  // Dark gray for title text
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
  },
});

  
