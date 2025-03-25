import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { BuildHabitsProvider } from '@/context/BuildHabitsContext';
import { DestroyHabitsProvider } from '@/context/DestroyHabitsContext';
import 'react-native-reanimated';


/// FONTS!!!!!!!!!!!!!!!!!!!1S



import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <BuildHabitsProvider>
          <DestroyHabitsProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="SetHabit" options={{ title: 'Set Habit' }} />
              <Stack.Screen name="SetDestroyHabit" options={{ title: 'Set destroy Habit' }} />
              <Stack.Screen name="LoginScreen" options={{ title: 'Login' }} />
              <Stack.Screen name="RegisterScreen" options={{ title: 'Register' }} />
            </Stack>
          </DestroyHabitsProvider>
          </BuildHabitsProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
