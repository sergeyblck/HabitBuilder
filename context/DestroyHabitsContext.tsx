import React, { createContext, useState, useEffect } from 'react';
import { subscribeToHabits, addHabit, editHabit } from '@/services/DestroyHabitsService';
import { Habit, HabitsContextType } from '@/types/HabitTypes';
import { getAuth } from 'firebase/auth';

export const DestroyHabitsContext = createContext<HabitsContextType | null>(null);

export function DestroyHabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsUserLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isUserLoggedIn) {
      const unsubscribe = subscribeToHabits(setHabits);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isUserLoggedIn]);

  if (!isUserLoggedIn) return <>{children}</>;

  return (
    <DestroyHabitsContext.Provider value={{ habits, addHabit, editHabit }}>
      {children}
    </DestroyHabitsContext.Provider>
  );
}
