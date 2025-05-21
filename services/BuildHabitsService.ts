// Updated HabitContext and BuildHabitsService to use new `log`-based habit tracking structure

// BuildHabitsService.ts
import { firestore } from '@/services/Firebase';
import { collection, addDoc, getDocs, onSnapshot, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { Habit } from '@/types/HabitTypes';
import { getAuth } from 'firebase/auth';

const HABIT_COLLECTION = 'good_habits';


export const editHabit = async (
  habitId: string,
  name: string,
  goal: number,
  reward: string,
  tries: number,
  times: Date[],
  duration?: { hours: number; minutes: number; seconds: number }
) => {
  try {
    const user = getAuth().currentUser;
    if (!user) throw new Error('User is not authenticated');

    const habitRef = doc(
      firestore,
      `users/${user.uid}/${HABIT_COLLECTION}`,
      habitId
    );

    const today = new Date().toISOString().split('T')[0];
    console.log(times);

    const safeDuration = duration && (
      typeof duration.hours === 'number' &&
      typeof duration.minutes === 'number' &&
      typeof duration.seconds === 'number'
    )
      ? {
        hours: duration.hours,
        minutes: duration.minutes,
        seconds: duration.seconds,
      }
      : null;

    await updateDoc(habitRef, {
      name,
      reward,
      duration: safeDuration,
      times: times.map((time) => time.toISOString()),
      [`log.${today}.goal`]: goal,
      [`log.${today}.tries`]: tries,
    });

    console.log('Habit updated successfully!');
  } catch (error) {
    console.error('Error updating habit:', error);
    throw new Error('Failed to update habit.');
  }
};

export const addHabit = async (
  name: string,
  goal: number,
  reward: string,
  tries: number,
  times: Date[],
  duration?: { hours: number; minutes: number; seconds: number }
) => {
  try {
    const user = getAuth().currentUser;
    if (!user) throw new Error('User is not authenticated');

    const userHabitsRef = collection(
      firestore,
      `users/${user.uid}/${HABIT_COLLECTION}`
    );

    const today = new Date().toISOString().split('T')[0];

    const safeDuration = duration && (
      typeof duration.hours === 'number' &&
      typeof duration.minutes === 'number' &&
      typeof duration.seconds === 'number'
    )
      ? {
        hours: duration.hours,
        minutes: duration.minutes,
        seconds: duration.seconds,
      }
      : null;

    await addDoc(userHabitsRef, {
      name,
      reward,
      totalDone: 0,
      goalsAchieved: 0,
      duration: safeDuration,
      times: times.map((time) => time.toISOString()),
      backgroundColor: 'FFFFFF',
      createdAt: Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0))),
      log: {
        [today]: {
          completed: 0,
          isCompleted: false,
          tries,
          goal,
          streak: 0
        }
      }
    });

    console.log('Habit added successfully!');
  } catch (error) {
    console.error('Error adding habit:', error);
    throw new Error('Failed to add habit. Please try again.');
  }
};

export const getHabits = async (): Promise<Habit[]> => {
  try {
    const user = getAuth().currentUser;
    if (!user) throw new Error('User is not authenticated');

    const habitsRef = collection(
      firestore,
      `users/${user.uid}/${HABIT_COLLECTION}`
    );
    const querySnapshot = await getDocs(habitsRef);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        reward: data.reward || '',
        totalDone: data.totalDone || 0,
        goalsAchieved: data.goalsAchieved || 0,
        times: data.times?.map((t: string) => new Date(t)) ?? [],
        backgroundColor: data.backgroundColor ?? 'FFFFFF',
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : new Date(),
        duration:
          data.duration && typeof data.duration === 'object'
            ? {
              hours: data.duration.hours ?? 0,
              minutes: data.duration.minutes ?? 0,
              seconds: data.duration.seconds ?? 0,
            }
            : null,
        log: data.log ?? {}
      };
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return [];
  }
};

export const subscribeToHabits = (callback: (habits: Habit[]) => void) => {
  try {
    const user = getAuth().currentUser;
    if (!user) throw new Error('User is not authenticated');

    const habitsRef = collection(
      firestore,
      `users/${user.uid}/${HABIT_COLLECTION}`
    );
    return onSnapshot(habitsRef, (snapshot) => {
      const habitsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          reward: data.reward || '',
          totalDone: data.totalDone || 0,
          goalsAchieved: data.goalsAchieved || 0,
          times: data.times?.map((t: string) => new Date(t)) ?? [],
          backgroundColor: data.backgroundColor ?? 'FFFFFF',
          createdAt:
            data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate()
              : new Date(),
          duration:
            data.duration && typeof data.duration === 'object'
              ? {
                hours: data.duration.hours ?? 0,
                minutes: data.duration.minutes ?? 0,
                seconds: data.duration.seconds ?? 0,
              }
              : null,
          log: data.log ?? {}
        };
      }) as Habit[];

      callback(habitsData);
    });
  } catch (error) {
    console.error('Error syncing habits:', error);
  }
};
