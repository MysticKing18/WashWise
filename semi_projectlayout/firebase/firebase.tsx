// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAA1O_p9ZMWvZjPW5xhAxgI2TTEKiM43-I",
  authDomain: "project-application-c04e8.firebaseapp.com",
  projectId: "project-application-c04e8",
  storageBucket: "project-application-c04e8.firebasestorage.app",
  messagingSenderId: "795747268519",
  appId: "1:795747268519:web:d84735c1764522f7c1a882",
  measurementId: "G-YND4RM4HL2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);