import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export default function ProgressWheel({ progress, streak, goal }: { progress: number, streak: number, goal: number }) {
  const radius = 25; 
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - progress * circumference;
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <Svg height={radius * 2} width={radius * 2}>
        <G rotation="-90" origin={`${radius}, ${radius}`}>
          <Circle
            stroke="#e0e0e0"
            fill="none"
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke="#3498db"
            fill="none"
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: radius * 2,
            height: radius * 2,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'black' }}>{percentage}</Text>
          <Text style={{ fontSize: 8, fontWeight: '600', color: 'black', marginTop: 1 }}>%</Text>
        </View>


      </Svg>
      <Text style={styles.label}>{streak}/{goal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
});
