import { firestore } from '@/services/Firebase';
import { collection, addDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { Habit } from '@/types/HabitTypes';
import { serverTimestamp } from 'firebase/database';

const HABIT_COLLECTION = 'bad_habits';


// ✅ Add a habit with all attributes
export const addHabit = async (name: string, goal: number, reward: string, tries: number, times: Date[]) => {
  try {
    await addDoc(collection(firestore, HABIT_COLLECTION), {
      name,
      goal,  // Store the actual goal, not a hardcoded value
      reward,  // Store the reward
      tries,  // Store number of tries
      times: times.map(time => time.toISOString()), // Store times as ISO strings
      streak: 0, // Default streak
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
    const querySnapshot = await getDocs(collection(firestore, HABIT_COLLECTION));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        goal: data.goal ?? 0, // Ensure default value
        reward: data.reward || '', // Ensure reward is included
        tries: data.tries ?? 1, // Ensure tries is included
        times: data.times?.map((t: string) => new Date(t)) ?? [], // Convert stored ISO timestamps back to Date
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
  return onSnapshot(collection(firestore, HABIT_COLLECTION), (snapshot) => {
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
  }, (error) => {
    console.error("Error listening to habits:", error);
    alert("Error syncing habits. Please check your connection.");
  });
};
