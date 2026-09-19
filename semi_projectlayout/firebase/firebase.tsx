// firebase/firebase.tsx

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "project-application-c04e8.firebaseapp.com",
  projectId: "project-application-c04e8",
  storageBucket: "project-application-c04e8.firebasestorage.app",
  messagingSenderId: "795747268519",
  appId: "YOUR_APP_ID",
  measurementId: "G-YND4RM4HL2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);