export type Habit = {
  id: string;
  name: string;
  reward: string;
  times: Date[];
  totalDone: number;
  goalsAchieved: number;
  createdAt: Date;
  duration?: { hours: number; minutes: number; seconds: number } | null;
  log: {
    [date: string]: {
      completed: number;
      isCompleted: boolean;
      tries: number;
      goal: number;
      streak: number;
    };
  };
};

export interface HabitsContextType {
  habits: Habit[];
  addHabit: (
    name: string,
    goal: number,
    reward: string,
    tries: number,
    times: Date[],
    duration?: { hours: number; minutes: number; seconds: number }
  ) => Promise<void>;
  editHabit: (
    habitId: string,
    name: string,
    goal: number,
    reward: string,
    tries: number,
    times: Date[],
    duration?: { hours: number; minutes: number; seconds: number }
  ) => Promise<void>;
}
