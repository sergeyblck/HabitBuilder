import React, { createContext, useState, useEffect } from 'react';
import { subscribeToHabits, addHabit, editHabit } from '@/services/BuildHabitsService';
import { Habit, HabitsContextType } from '@/types/HabitTypes';
import { getAuth } from 'firebase/auth';

export const BuildHabitsContext = createContext<HabitsContextType | null>(null);

export function BuildHabitsProvider({ children }: { children: React.ReactNode }) {
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
    <BuildHabitsContext.Provider value={{ habits, addHabit, editHabit }}>
      {children}
    </BuildHabitsContext.Provider>
  );
}
