import { FlatList } from 'react-native';
import HabitItem from './HabitItem';

export default function HabitList({
  habits,
  habitType,
  onComplete,
  onUpdateCompletedToday,
  onStartStopwatch,
}: {
  habits: any[];
  habitType: string;
  onComplete: (habitId: string, isCompletedToday: boolean) => void;
  onUpdateCompletedToday: (habitId: string, op: 'inc' | 'dec') => void;
  onStartStopwatch: (habit: any) => void;
}) {
  return (
    <FlatList
      data={habits}
      renderItem={({ item }) => (
        <HabitItem
          habit={item}
          habitType={habitType}
          onComplete={onComplete}
          onUpdateCompletedToday={onUpdateCompletedToday}
          onStartStopwatch={onStartStopwatch}
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
}

