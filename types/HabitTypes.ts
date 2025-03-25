export type Habit = {
  id: string;
  name: string;
  goal: number;
  reward: string;
  tries: number;
  times: Date[];
  streak: number;
  completedDays: Date[];
};

export interface HabitsContextType {
  habits: Habit[];
  addHabit: (name: string, goal: number, reward: string, tries: number, times: Date[]) => Promise<void>;
  updateDate: (completedDays: Date[]) => Promise<void>;
}

