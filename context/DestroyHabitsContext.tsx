import { createContext, useState, useEffect } from 'react';
import { addHabit, subscribeToHabits } from '@/services/DestroyHabitsService';
import { Habit, HabitsContextType } from '@/types/HabitTypes';

export const DestroyHabitsContext = createContext<HabitsContextType | null>(null);

export function DestroyHabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToHabits(setHabits);
    return () => unsubscribe();
  }, []);

  return (
    <DestroyHabitsContext.Provider value={{ habits, addHabit }}>
      {children}
    </DestroyHabitsContext.Provider>
  );
}
