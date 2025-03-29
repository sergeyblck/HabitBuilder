// utils/addPrebuiltHabits.ts
import { firestore } from '@/services/Firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export const AddDefaultHabits = async () => {
  const prebuiltHabitsRef = collection(firestore, 'default_bad_habits');
    console.log("Here");
    const habits = [
        {
          name: "Stop smoking",
          tries: 0,
          times: [
            Timestamp.fromDate(new Date('2023-01-01T12:00:00Z')), 
            Timestamp.fromDate(new Date('2023-01-01T17:00:00Z')),
            Timestamp.fromDate(new Date('2023-01-01T22:00:00Z')),
          ],
          label: "Maximum amount of smoking per day",
          icon: "cafe", // ☕️ cigarette-looking icon from Ionicons
        },
        {
          name: 'Stop drinking Alcohol',
          tries: 0,
          times: [
            Timestamp.fromDate(new Date('2023-01-01T19:00:00Z'))
          ],
          duration: [
            Timestamp.fromDate(new Date('2023-01-01T00:30:00Z'))
          ],
          label: "Maximum amount of drinks per day",
          icon: "wine-outline", // 🍷 wine glass icon from Ionicons
        },
      ];
      

  try {
    for (let habit of habits) {
      await addDoc(prebuiltHabitsRef, habit);
    }
    console.log('Prebuilt habits added successfully!');
  } catch (error) {
    console.error('Error adding prebuilt habits: ', error);
  }
};
