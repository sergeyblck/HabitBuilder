import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth, User } from 'firebase/auth'; 
import { firestore } from '@/services/Firebase'; // Adjust as needed

export default function HabitInfo() {
  const { habitId } = useLocalSearchParams(); // ✅ Correct way to get [habitId]
  const [habit, setHabit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Handle user authentication and redirection if not authenticated
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('./LoginScreen');
      }
    });

    return () => unsubscribe();  // Cleanup the auth listener when the component unmounts
  }, [router]);

  useEffect(() => {
    if (!habitId || typeof habitId !== 'string' || !user) return;  // Ensure user is set before trying to fetch habit

    const fetchHabit = async () => {
      try {
        const ref = doc(firestore, `users/${user.uid}/good_habits`, habitId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setHabit(snap.data());
        } else {
          console.log('Habit not found!');
        }
      } catch (error) {
        console.error('Error fetching habit:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHabit();
  }, [habitId, user]); // Dependencies: rerun when habitId or user changes

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (!habit) {
    return (
      <View style={styles.container}>
        <Text>Habit not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{habit.name}</Text>
      <Text style={styles.status}>Good Habit</Text>
      <Text style={styles.subtitle}>Completed Days:</Text>
      {habit.completedDays?.map((day: string, idx: number) => (
        <Text key={idx} style={styles.dayText}>{day}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  status: { fontSize: 18, color: '#555' },
  subtitle: { marginTop: 20, fontSize: 16, fontWeight: '600' },
  dayText: { fontSize: 14, color: '#333', marginVertical: 2 },
});
