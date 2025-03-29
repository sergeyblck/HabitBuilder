import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Build',
            tabBarIcon: ({ size }) => (
              <Image
                source={require('../../assets/images/efficacy.png')}
                style={{ width: size, height: size, resizeMode: 'contain' }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="DestroyHabit"
          options={{
            title: 'Destroy',
            tabBarIcon: ({ size }) => (
              <Image
                source={require('../../assets/images/danger.png')}
                style={{ width: size, height: size, resizeMode: 'contain' }}
              />
            ),
          }}
        />
      </Tabs>
      
  );
}
