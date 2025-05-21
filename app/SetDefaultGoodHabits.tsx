import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { firestore } from '@/services/Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { SplashScreen, useRouter } from 'expo-router';
import { Asset } from 'expo-asset';

const SetDefaultGoodHabits = () => {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();


  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'default_good_habits'));
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
          require('@/assets/images/water.png'),
          require('@/assets/images/exercise.png'),
          require('@/assets/images/good_custom.png'),
          require('@/assets/images/reading.png'),
          require('@/assets/images/walking.png'),
          require('@/assets/images/pills.png'),
          require('@/assets/images/stretch.png'),
          require('@/assets/images/running.png'),
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
    router.push({
      pathname: '/SetHabit',
      params: { habit: JSON.stringify(habit), mode: 'new' },
    });
  };

  const handleCustomHabit = () => {
    router.push({
      pathname: '/SetHabit',
      params: {},
    });
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  const iconMap: Record<string, any> = {
    'Drink Water': require('@/assets/images/water.png'),
    'Exercise': require('@/assets/images/exercise.png'),
    'Custom Habit': require('@/assets/images/good_custom.png'),
    'Read a Book': require('@/assets/images/reading.png'),
    'Walk': require('@/assets/images/walking.png'),
    'Take a Pill': require('@/assets/images/pills.png'),
    'Stretch': require('@/assets/images/stretch.png'),
    'Run': require('@/assets/images/running.png'),
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Habit</Text>

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
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitItem: {
    padding: 15,
    backgroundColor: '#F5F5F5',
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  habitText: {
    fontSize: 18,
  },
});

export default SetDefaultGoodHabits;
