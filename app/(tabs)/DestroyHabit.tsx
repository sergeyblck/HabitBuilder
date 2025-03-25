import { View, Text, Button, StyleSheet } from 'react-native';
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import SetHabit from '@/app/SetHabit';
import HabitList from '@/components/ui/HabitList';
import { firestore } from '@/services/Firebase';
import { DestroyHabitsContext } from '@/context/DestroyHabitsContext';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

export default function DestroyHabit() {
  
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

  const habitsContext = useContext(DestroyHabitsContext);
  
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
  
      const habitRef = doc(firestore, `users/${user.uid}/bad_habits`, habitId);
      const today = new Date().toISOString().split("T")[0];

      if (isCompletedToday) {
        await updateDoc(habitRef, {
          completedDays: arrayRemove(today),
          streak: increment(-1),
        });
      } else {
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
      <Text style={styles.header}>Destroy your bad Habits</Text>

      <HabitList habits={habitsContext.habits} onComplete={handleComplete} />

      <Button title="Destroy a bad Habit" onPress={() => router.push('../SetDestrotHabit')} />
      
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
