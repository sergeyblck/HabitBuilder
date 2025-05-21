import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image,Text } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            //ios: {
            //  position: 'absolute',
            //},
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: ({ focused }) => (
              <Text style={{ 
                color: focused ? '#007AFF' : '#000',
                fontSize: 10,
                fontWeight: '600',
              }}>
                Build
              </Text>
            ),
            tabBarIcon: ({ size, focused }) => (
              <Image
                source={
                  focused
                    ? require('../../assets/images/efficacy-active.png')
                    : require('../../assets/images/efficacy.png')
                }
                style={{ width: size, height: size}}
              />
            ),            
          }}
        />
        <Tabs.Screen
          name="DestroyHabit"
          options={{
            tabBarLabel: ({ focused }) => (
              <Text style={{ 
                color: focused ? '#BE1111' : '#000',
                fontSize: 10,
                fontWeight: '600',
              }}>
                Destroy
              </Text>
            ),
            tabBarIcon: ({ size, focused }) => (
              <Image
              source={
                focused
                  ? require('../../assets/images/danger-active.png')
                  : require('../../assets/images/danger.png')
              }
                style={{ width: size, height: size, resizeMode: 'contain' }}
              />
            ),
          }}
        />
      </Tabs>
      
  );
}
