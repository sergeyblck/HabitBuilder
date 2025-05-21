import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { firestore } from '@/services/Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { SplashScreen, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';


const SetDefaultBadHabits = () => {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'default_bad_habits'));
        const habitsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHabits(habitsData);
      } catch (error) {
        console.error('Error fetching habits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, []);

  
    useEffect(() => {
      const loadAssets = async () => {
        try {
          await SplashScreen.preventAutoHideAsync(); // Prevent flicker
          await Asset.loadAsync([
            require('@/assets/images/smoking.png'),
            require('@/assets/images/alcohol.png'),
            require('@/assets/images/custom.png'),
          ]);
        } catch (err) {
          console.warn('Error loading assets:', err);
        } finally {
          setLoading(false);
          await SplashScreen.hideAsync();
        }
      };
    
      loadAssets();
    }, []);

  const handleSelectHabit = (habit: any) => {
    // Pass selected habit to SetHabit screen via params
    router.push({
      pathname: '/SetDestroyHabit',
      params: { habit: JSON.stringify(habit) },
    });
  };

  const handleCustomHabit = () => {
    // Navigate to SetHabit screen with no params for custom habit
    router.push({
      pathname: '/SetDestroyHabit',
      params: {},
    });
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  const iconMap: Record<string, any> = {
    'Stop smoking': require('@/assets/images/smoking.png'),
    'Stop drinking Alcohol': require('@/assets/images/alcohol.png'),
    'Custom Habit': require('@/assets/images/custom.png'),
    // add more as needed
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Prebuilt Habit</Text>

      {/* Custom Habit Button */}
      <TouchableOpacity style={styles.habitItem} onPress={handleCustomHabit}>
      <View style={styles.habitRow}>
                <Image
                    source={iconMap["Custom Habit"]}
                    style={{ width: 24, height: 24, marginRight: 10 }}
                    resizeMode="contain"
                />
        <Text style={styles.habitText}>Custom Habit</Text>
        </View>
      </TouchableOpacity>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <TouchableOpacity style={styles.habitItem} onPress={() => handleSelectHabit(item)}>
            <View style={styles.habitRow}>
                {iconMap[item.name] && (
                <Image
                    source={iconMap[item.name]}
                    style={{ width: 24, height: 24, marginRight: 10 }}
                    resizeMode="contain"
                />
                )}
                <Text style={styles.habitText}>{item.name}</Text>
            </View>
            </TouchableOpacity>
        )}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    marginTop: 50,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  habitItem: {
    padding: 15,
    backgroundColor: '#F5F5F5',
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  habitText: {
    fontSize: 18,
  },
});

export default SetDefaultBadHabits;
