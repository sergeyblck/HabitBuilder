import { View, Text, Button, StyleSheet } from 'react-native';
import React, { useState, useContext } from 'react';
import SetDestroyHabit from '@/app/SetDestroyHabit';
import HabitList from '@/components/ui/HabitList';
import { DestroyHabitsContext } from '@/context/DestroyHabitsContext';
import { useRouter } from 'expo-router';

export default function DestroyHabit() {
  const habitsContext = useContext(DestroyHabitsContext);
  const router = useRouter();

  if (!habitsContext) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleComplete = (id: string) => {
    const updatedHabits = habitsContext.habits.map(habit =>
      habit.id === id ? { ...habit, sequence: habit.sequence + 1 } : habit
    );
    habitsContext.setHabits(updatedHabits);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Bad Habits</Text>

      <HabitList habits={habitsContext.habits} onComplete={handleComplete} />

      <Button title="Destroy a bad Habit" onPress={() => router.push('../SetDestroyHabit')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginTop:50,
    fontSize: 20,
    marginBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
