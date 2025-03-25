import React, { createContext, useState, useEffect } from 'react';
import { subscribeToHabits, addHabit } from '@/services/BuildHabitsService'; 
import { Habit, HabitsContextType } from '@/types/HabitTypes';
import { getAuth } from 'firebase/auth';

export const BuildHabitsContext = createContext<HabitsContextType | null>(null);

export function BuildHabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    // Check if the user is logged in initially
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsUserLoggedIn(true);
      } else {
        setIsUserLoggedIn(false);
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Start subscribing to habits only when the user is logged in
  useEffect(() => {
    if (isUserLoggedIn) {
      const unsubscribe = subscribeToHabits(setHabits);
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [isUserLoggedIn]);

  if (!isUserLoggedIn) {
    return <>{children}</>; // Render nothing or a placeholder while waiting for the user to log in
  }

  return (
    <BuildHabitsContext.Provider value={{ habits, addHabit }}>
      {children}
    </BuildHabitsContext.Provider>
  );
}
