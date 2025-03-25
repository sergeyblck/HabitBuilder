import { FlatList } from 'react-native';
import HabitItem from './HabitItem';

export default function HabitList({ habits, onComplete }: { habits: any[], onComplete: (id: string) => void }) {
  return (
    <FlatList
      data={habits}
      renderItem={({ item }) => <HabitItem habit={item} onComplete={() => onComplete(item.id)} />}
      keyExtractor={(item) => item.id}
    />
  );
}