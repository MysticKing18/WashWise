// firebase/firebase.tsx

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAA1O_p9ZMWvZjPW5xhAxgI2TTEKiM43-I",
  authDomain: "project-application-c04e8.firebaseapp.com",
  projectId: "project-application-c04e8",
  storageBucket: "project-application-c04e8.firebasestorage.app",
  messagingSenderId: "795747268519",
  appId: "1:795747268519:web:d84735c1764522f7c1a882",
  measurementId: "G-YND4RM4HL2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);

// Firebase Storage
export const storage = getStorage(app, "gs://project-application-c04e8.firebasestorage.app");