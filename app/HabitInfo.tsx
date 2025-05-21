import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Svg, { Circle, G } from 'react-native-svg';

export default function HabitInfo() {
  const { habit: habitJson, habitType } = useLocalSearchParams();
  const router = useRouter();
  const habit = JSON.parse(typeof habitJson === 'string' ? habitJson : habitJson[0]);
  const today = new Date().toISOString().split("T")[0];

  const logEntries = habit.log || {};
  const dates = Object.keys(logEntries);


  const achievedGoals = habit.goalsAchieved;
  const currentGoal = logEntries[today].goal;
  const totalDone = habit.totalDone;
  const dayCount = dates.length;
  const completedToday = logEntries[today].completed;
  const dayGoal = logEntries[today].tries;
  const currentProgress = logEntries[today].streak;
  const daysWithData = dates.filter(date => {
    const entry = logEntries[date];
    return habitType === 'bad_habits' ? entry.isCompleted === false : entry.isCompleted === true;
  });
  
  const overallRate = dayCount ? ((daysWithData.length / dayCount) * 100).toFixed(0) : 0;

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  const sortedDates = dates.sort();
  for (const date of sortedDates) {
    const isSuccess = habitType === 'bad_habits'
      ? logEntries[date].isCompleted === false
      : logEntries[date].isCompleted === true;
  
    if (isSuccess) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }
  
  currentStreak = streak;

  const stats = [
    { label: habitType === 'bad_habits' ? 'Failed Today' : 'Completed Today', value: completedToday },
    { label: habitType === 'bad_habits' ? 'Fails Allowed': 'Day Goal', value: dayGoal },
    { label: habitType === 'bad_habits' ? 'Days Being Strong' : 'Current Progress', value: currentProgress },
    { label: 'Main Goal', value: currentGoal },
    { label: habitType === 'bad_habits' ? 'Total Fails' : 'Total Done', value: totalDone },
    { label: 'Success Rate', value: `${overallRate}%` },
    { label: 'Current Streak', value: currentStreak },
    { label: 'Longest Streak', value: longestStreak },
  ];
  

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const getCalendarDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const localDate = new Date(year, month, day);
      const isoDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())).toISOString().split('T')[0];
      const entry = logEntries[isoDate] || null;
      days.push({ day, entry });
    }

    return days;
  };

  const calendarDays = getCalendarDays();
  const monthName = currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  const CircularProgress = ({ progress }: { progress: number }) => {
    const radius = 16;
    const strokeWidth = 3;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const strokeDashoffset = circumference - progress * circumference;

    return (
      <Svg height={radius * 2} width={radius * 2} style={StyleSheet.absoluteFill}>
        <G rotation="-90" origin={`${radius}, ${radius}`}>          
          <Circle
            stroke="#f9f9f9"
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
      </Svg>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{habit.name}</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/SetHabit', params: { habit: JSON.stringify(habit), mode: 'edit' } })}>
          <Ionicons name="create-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
       
        <View style={styles.grid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardValue}>{stat.value}</Text>
              <Text style={styles.cardLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.goalsCard}>
        <Text style={styles.goalsValue}>{achievedGoals}</Text>
          <Text style={styles.goalsLabel}>Goals Achieved</Text>
        </View>


        <View style={styles.rewardContainer}>
          <Text style={styles.rewardTitle}>Reward</Text>
          <Text style={styles.rewardText}>{habit.reward || '🎁'}</Text>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={28} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>{monthName}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
              <Ionicons name="chevron-forward" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((cell, index) => (
              <View key={index} style={styles.calendarCell}>
                {cell ? (
                  <View style={[styles.dateBubble, cell.entry?.isCompleted && styles.completedDay]}>
                    {cell.entry && !cell.entry.isCompleted && cell.entry.tries > 1 && cell.entry.completed > 0 && (
                      <CircularProgress progress={cell.entry.completed / cell.entry.tries} />
                    )}
                    <Text style={[styles.dateText, cell.entry?.isCompleted && { color: '#fff' }]}>{cell.day}</Text>
                  </View>
                ) : <View style={styles.emptyCell} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 30,
    position: 'relative',
  },
  headerRow: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    marginBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  
    // Android shadow
    elevation: 4,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    rowGap: 20,
    columnGap: 10,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor:'#efefef',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#007AFF',
  },
  cardLabel: {
    fontSize: 13,
    color: '#343434',
    marginTop: 6,
    textAlign: 'center',
  },
  calendarContainer: {
    paddingHorizontal: 20,
    borderTopWidth: 10,
    borderColor: '#efefef',
    marginTop:40,
    paddingTop:40,
    width: '100%',
  },
  calendarArrow: {
    padding: 10,
  },
  
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  completedDay: {
    backgroundColor: '#007AFF',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  emptyCell: {
    width: 32,
    height: 32,
  },
  goalsCard: {
    width: '90%',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#efefef',
    alignItems: 'center',
    alignSelf: 'center',
  },
  
  goalsValue: {
    fontSize: 22,
    color: '#007AFF',
  },
  
  goalsLabel: {
    fontSize: 13,
    color: '#343434',
    marginTop: 4,
  },  
  
  rewardContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 16,
    borderColor:'#efefef',
    padding: 24,
    marginTop: 15,
    alignItems: 'center',

  },
  rewardTitle: {
    fontSize: 13,
    color: '#343434',
    marginBottom: 6,
  },
  rewardText: {
    fontSize: 22,
    color: '#007AFF',
  },
});
