import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,

  // @ts-ignore
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyAcSkuuVNHnDrx0Mshvmd30fO2By81bgcc",
  authDomain: "habitbuilder-aa233.firebaseapp.com",
  projectId: "habitbuilder-aa233",
  storageBucket: "habitbuilder-aa233.appspot.com",
  messagingSenderId: "385514200471",
  appId: "1:385514200471:web:919a7c36369e59ec4138d2",
  measurementId: "G-21315E5T1T1"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Firebase Auth without persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
const firestore = getFirestore(app);

// Export instances
export { app, auth, firestore };
