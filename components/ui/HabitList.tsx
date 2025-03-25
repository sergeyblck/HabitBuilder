import { FlatList } from 'react-native';
import HabitItem from './HabitItem';

export default function HabitList({ habits, onComplete }: { habits: any[], onComplete: (habitId: string, isCompletedToday: boolean) => void }) {
  return (
    <FlatList
      data={habits}
      renderItem={({ item }) => (
        <HabitItem 
          habit={item} 
          onComplete={(habitId: string, isCompletedToday: boolean) => onComplete(habitId, isCompletedToday)} 
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
