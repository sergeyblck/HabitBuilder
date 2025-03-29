import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ProgressWheel from './ProgressWheel';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from "firebase/firestore";
import { onAuthStateChanged, getAuth, User } from 'firebase/auth'; 
import { firestore } from '@/services/Firebase';

export default function HabitItem({ habit, habitType, onComplete }: { habit: any, habitType: string, onComplete: (habitId: string, isCompletedToday: boolean) => void }) {
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [completedToday, setCompletedToday] = useState(0); // Track how many times the habit is completed today
  const router = useRouter();  // Get navigation object
  const backgroundColor = habit.backgroundColor;
  console.log(backgroundColor);
  useEffect(() => {
    // Set completedToday based on how many times today's date is in completedDays
    setIsCompletedToday(habit.completedDays?.includes(today));
    setCompletedToday(habit.completedToday);
  }, [habit.completedDays, habit.completedToday, today]);

  const handlePress = () => {
    if (habit.tries === 1) {
      onComplete(habit.id, isCompletedToday);
    } else {
      // Handle the case where tries > 1, so we can adjust completedToday
      if (completedToday === habit.tries) {
        onComplete(habit.id, isCompletedToday);
        console.log("Here")
      }
    }
  };
  const getProgressColor = () => {
    if (completedToday === habit.tries) {
      return { color: '#27ae60' }; // green
    } else if (completedToday < habit.tries) {
      return { color: '#333' }; // dark gray/black
    } else {
      return { color: '#DAA520' }; // gold tone
    }
  };
  
  
  const updateCompletedToday = async (op: string) => {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error("User is not authenticated");

      console.log(habitType);
      const habitRef = doc(firestore, `users/${user.uid}/${habitType}`, habit.id);
      const habitDoc = await getDoc(habitRef);

      if (!habitDoc.exists()) throw new Error("Habit not found");

      // Directly update the completedToday state before database update
      let newCompletedToday = completedToday;
      if (op === "inc") {
        newCompletedToday = completedToday + 1;
      } else if (op === "dec") {
        newCompletedToday = completedToday - 1;
      }

      // Update the state
      setCompletedToday(newCompletedToday);

      // Update the completedToday in the database
      await updateDoc(habitRef, {
        completedToday: newCompletedToday,
      });

      // Call onComplete when conditions are met
      if (op === "inc" && newCompletedToday === habit.tries) {
        onComplete(habit.id, isCompletedToday);
      } else if (op === "dec" && newCompletedToday === habit.tries - 1) {
        onComplete(habit.id, isCompletedToday);
      }

      console.log("Habit completion updated successfully!");
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  };

  const incrementCompletedToday = () => {
    updateCompletedToday("inc");
  };

  const decrementCompletedToday = () => {
    if(completedToday > 0){
    updateCompletedToday("dec");
    }
  };

  const navigateToHabitInfo = () => {
    router.push(`../HabitInfo?habitId=${habit.id}`);
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
          <View style={styles.triesButtonsRow}>
            <Pressable onPress={decrementCompletedToday} style={styles.smallButton}>
              <Ionicons name="remove" size={16} color="#007AFF" />
            </Pressable>
            <Pressable onPress={incrementCompletedToday} style={styles.smallButton}>
              <Ionicons name="add" size={16} color="#007AFF" />
            </Pressable>
          </View>
          <Text style={[styles.triesStyledText, getProgressColor()]}>
            {completedToday} / {habit.tries}
          </Text>

        </View>
        
        ) : (
          <Pressable
            onPress={handlePress}
            style={ styles.doneContainer}
          >
            {isCompletedToday ? (
              <View style={styles.doneContent}>
                <Text style={styles.undoneText}>Undo</Text>
                <Ionicons name="close" size={16} color="#7f8c8d" style={{ marginLeft: 4 }} />
              </View>
            ) : (
              <View style={styles.doneContent}>
                <Text style={styles.doneText}>Done</Text>
                <Ionicons name="checkmark" size={16} color="#007AFF" style={{ marginLeft: 4 }} />
              </View>
            )}
          </Pressable>
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
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    padding: 10,
  },
  disabledButton: {
    backgroundColor: '#7f8c8d',
  },
  triesButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triesButton: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    padding: 10,
    marginHorizontal: 5,
  },
  triesText: {
    color: 'black',
    fontSize: 18,
    paddingHorizontal: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressText: {
    marginTop: 10,
    color: 'black',
    fontSize: 14,
    marginLeft: 10,
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
