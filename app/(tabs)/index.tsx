import { View, Text, Button, StyleSheet } from 'react-native';
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import SetHabit from '@/app/SetHabit';
import HabitList from '@/components/ui/HabitList';
import { firestore } from '@/services/Firebase';
import { BuildHabitsContext } from '@/context/BuildHabitsContext';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

export default function BuildHabit() {
  
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);

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
  
  if (!habitsContext) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleComplete = async (habitId: string, isCompletedToday: boolean) => {
    try {
      const user = getAuth().currentUser;
  
      if (!user) {
        throw new Error("User is not authenticated");
      }
  
      const habitRef = doc(firestore, `users/${user.uid}/good_habits`, habitId);
      const today = new Date().toISOString().split("T")[0];

      if (isCompletedToday) {
        // Undo completion (remove the day from completedDays and decrease streak)
        await updateDoc(habitRef, {
          completedDays: arrayRemove(today),
          streak: increment(-1),
        });
      } else {
        // Complete habit (add the day to completedDays and increase streak)
        await updateDoc(habitRef, {
          completedDays: arrayUnion(today),
          streak: increment(1),
        });
      }
  
      console.log("Habit completion toggled successfully!");
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Good Habits</Text>

      <HabitList habits={habitsContext.habits} onComplete={handleComplete} />

      <Button title="Build a new Habit" onPress={() => router.push('../SetHabit')} />
      
      {// Logout button <Button title="Log Out" onPress={logout} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginTop: 50,
    fontSize: 20,
    marginBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
