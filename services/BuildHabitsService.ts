import { firestore } from '@/services/Firebase';
import { collection, addDoc, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Habit } from '@/types/HabitTypes';
import { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';

const HABIT_COLLECTION = 'good_habits';

export const addHabit = async (name: string, goal: number, reward: string, tries: number, times: Date[]) => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const userHabitsRef = collection(firestore, `users/${user.uid}/${HABIT_COLLECTION}`);

    await addDoc(userHabitsRef, {
      name,
      goal,
      reward,
      tries,
      times: times.map(time => time.toISOString()),
      streak: 0,
      createdAt: serverTimestamp(),
      completedDays: [],
      backgroundColor: "FFFFFF",
    });

    console.log("Habit added successfully!");
  } catch (error) {
    console.error("Error adding habit:", error);
    throw new Error("Failed to add habit. Please try again.");
  }
};



export const getHabits = async (): Promise<Habit[]> => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const habitsRef = collection(firestore, `users/${user.uid}/${HABIT_COLLECTION}`);
    const querySnapshot = await getDocs(habitsRef);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        goal: data.goal ?? 0,
        reward: data.reward || '',
        tries: data.tries ?? 1,
        times: data.times?.map((t: string) => new Date(t)) ?? [],
        streak: data.streak ?? 0,
        createdAt: data.createdAt && typeof data.createdAt.toDate === "function" 
          ? data.createdAt.toDate() 
          : new Date(),
        completedDays: data.completedDays ?? [],
        backgroundColor: data.backgroundColor ?? "FFFFFF",
      };
    });
  } catch (error) {
    console.error("Error fetching habits:", error);
    return [];
  }
};


export const subscribeToHabits = (callback: (habits: Habit[]) => void) => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      
      throw new Error("User is not authenticated");
    }

    const habitsRef = collection(firestore, `users/${user.uid}/${HABIT_COLLECTION}`);
    return onSnapshot(habitsRef, (snapshot) => {
      const habitsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          goal: data.goal ?? 0,
          reward: data.reward || '',
          tries: data.tries ?? 1,
          times: data.times?.map((t: string) => new Date(t)) ?? [],
          streak: data.streak ?? 0,
          createdAt: data.createdAt && typeof data.createdAt.toDate === "function" 
            ? data.createdAt.toDate() 
            : new Date(),
          completedDays: data.completedDays ?? [],
          completedToday: data.completedToday ?? 0,
          backgroundColor: data.backgroundColor ?? "FFFFFF",
        };
      }) as Habit[];
  
      callback(habitsData);
    });
  } catch (error) {
    console.error("Error syncing habits:", error);
  }
};
