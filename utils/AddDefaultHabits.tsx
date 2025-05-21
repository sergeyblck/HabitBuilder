// utils/addPrebuiltHabits.ts
import { firestore } from '@/services/Firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export const AddDefaultHabits = async () => {
  const prebuiltHabitsRef = collection(firestore, 'default_good_habits');
    console.log("Here");
    const habits = [
        {
          name: "Read a Book",
          tries: 1,
          times: [
            Timestamp.fromDate(new Date('2023-01-01T22:00:00Z')), 
          ],
          label: "Amount of daily sets of reading",
        },
        {
          name: "Walk",
          tries: 1,
          times: [
            Timestamp.fromDate(new Date('2023-01-01T20:00:00Z')), 
          ],
          label: "Amount of daily walkings",
        },
        {
          name: "Run",
          tries: 1,
          times: [
            Timestamp.fromDate(new Date('2023-01-01T20:00:00Z')), 
          ],
          label: "Amount of daily runnings",
        },
        {
          name: "Stretch",
          tries: 2,
          times: [
            Timestamp.fromDate(new Date('2023-01-01T10:00:00Z')), 
            Timestamp.fromDate(new Date('2023-01-01T22:00:00Z')), 
          ],
          label: "Amount of daily stretches",
        },
        {
          name: "Take a Pill",
          tries: 1,
          times: [
            Timestamp.fromDate(new Date('2023-01-01T10:00:00Z')),
          ],
          label: "Amount of daily pills",
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
