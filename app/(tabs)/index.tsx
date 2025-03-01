import { Image, StyleSheet, Platform, Button } from 'react-native';

import SetHabit from '@/components/ui/SetHabit';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { View ,Text} from 'react-native';
import React, { useState } from 'react';


export default function HomeScreen() {
  const [showInput, setShowInput] = useState(false);
  
  return (
        <View style={{flex:1 ,justifyContent:'center'}}>
          <Text style={{justifyContent:'center', alignSelf:'center'}}>Hello</Text>
          <Button title="Add Habit" onPress={() => setShowInput(true)} />
          <SetHabit visible={showInput} onClose={() => setShowInput(false)} />
        </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
