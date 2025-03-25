import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyAcSkuuVNHnDrx0Mshvmd30fO2By81bgcc",
    authDomain: "habitbuilder-aa233.firebaseapp.com",
    projectId: "habitbuilder-aa233",
    storageBucket: "habitbuilder-aa233.firebasestorage.app",
    messagingSenderId: "385514200471",
    appId: "1:385514200471:web:919a7c36369e59ec4138d2",
    measurementId: "G-21315E5T1T"
  };

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),  // Correctly configure persistence
});

const firestore = getFirestore(app);
export { auth, firestore };
