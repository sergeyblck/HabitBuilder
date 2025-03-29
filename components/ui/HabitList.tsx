import { FlatList } from 'react-native';
import HabitItem from './HabitItem';

export default function HabitList({ habits, habitType, onComplete }: { habits: any[], habitType: string, onComplete: (habitId: string, isCompletedToday: boolean) => void }) {
  return (
    <FlatList
      data={habits}
      renderItem={({ item }) => (
        <HabitItem 
          habit={item} 
          habitType={habitType}
          onComplete={(habitId: string, isCompletedToday: boolean) => onComplete(habitId, isCompletedToday)} 
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
