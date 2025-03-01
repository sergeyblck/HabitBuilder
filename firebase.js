// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Your Firebase configuration (this info is available in Firebase Console under project settings)
const firebaseConfig = {
    apiKey: "AIzaSyAcSkuuVNHnDrx0Mshvmd30fO2By81bgcc",
    authDomain: "habitbuilder-aa233.firebaseapp.com",
    projectId: "habitbuilder-aa233",
    storageBucket: "habitbuilder-aa233.firebasestorage.app",
    messagingSenderId: "385514200471",
    appId: "1:385514200471:web:919a7c36369e59ec4138d2",
    measurementId: "G-21315E5T1T"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Set up Firebase services (Auth, Firestore, etc.)
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

export { auth, firestore, database };
