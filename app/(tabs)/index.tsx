import { View, Text, Button, StyleSheet } from 'react-native';
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
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
    // Check if user is logged in using Firebase Authentication
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in
        setUser(user);
      } else {
        // User is not logged in, redirect to login page
        router.push('../LoginScreen');
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [router]);
  // Fetch context values for habits and authentication
  const habitsContext = useContext(BuildHabitsContext);
  
  if (!habitsContext) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Handle the completion of a habit
  const handleComplete = async (habitId: string) => {
    try {
      // Get the current authenticated user
      const user = getAuth().currentUser;
  
      // Check if the user is authenticated
      if (!user) {
        throw new Error("User is not authenticated");
      }
  
      // Get the reference to the habit document under the user's collection
      const habitRef = doc(firestore, `users/${user.uid}/good_habits`, habitId);
  
      // Update the habit with today's completed date and increment the streak
      await updateDoc(habitRef, {
        completedDays: arrayUnion(new Date().toISOString().split("T")[0]), // Add today's date to the completedDays array
        streak: increment(1), // Increment the streak by 1
      });
  
      console.log("Habit completed successfully!");
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Good Habits</Text>

      {/* Display the list of habits */}
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
