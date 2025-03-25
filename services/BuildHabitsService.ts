import { firestore } from '@/services/Firebase';
import { collection, addDoc, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Habit } from '@/types/HabitTypes';
import { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import { getAuth } from 'firebase/auth'; // Get current authenticated user

const HABIT_COLLECTION = 'good_habits';

// ✅ Add a habit with all attributes
export const addHabit = async (name: string, goal: number, reward: string, tries: number, times: Date[]) => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Save the habit under the user's UID
    const userHabitsRef = collection(firestore, `users/${user.uid}/${HABIT_COLLECTION}`);

    await addDoc(userHabitsRef, {
      name,
      goal,
      reward,
      tries,
      times: times.map(time => time.toISOString()), // Store times as ISO strings
      streak: 0,
      createdAt: serverTimestamp(),
      completedDays: [] // Empty array initially
    });

    console.log("Habit added successfully!");
  } catch (error) {
    console.error("Error adding habit:", error);
    throw new Error("Failed to add habit. Please try again.");
  }
};



// ✅ Fetch habits correctly
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
        completedDays: data.completedDays ?? []
      };
    });
  } catch (error) {
    console.error("Error fetching habits:", error);
    return [];
  }
};


// ✅ Subscribe to real-time updates with correct structure
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
          completedDays: data.completedDays ?? []
        };
      }) as Habit[];
  
      callback(habitsData);
    });
  } catch (error) {
    console.error("Error syncing habits:", error);
  }
};
