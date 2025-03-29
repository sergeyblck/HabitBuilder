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
              <Stack.Screen name="SetHabit" options={{ headerShown: false }} />
              <Stack.Screen name="SetDestroyHabit" options={{ headerShown: false }} />
              <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
              <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
              <Stack.Screen name="HabitInfo" options={{ headerShown: false }} />
              <Stack.Screen name="SetDefaultGoodHabits" options={{ headerShown: false }} />
              <Stack.Screen name="SetDefaultBadHabits" options={{ headerShown: false }} />
            </Stack>
          </DestroyHabitsProvider>
        </BuildHabitsProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
