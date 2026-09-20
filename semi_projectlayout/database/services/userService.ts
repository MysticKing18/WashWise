import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { User } from "../models/User";

const usersRef = collection(db, "users");

export type NewUser = {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
};

export type EditableUserProfile = {
  fullName: string;
  phone?: string;
};

export const createUser = async (user: NewUser): Promise<void> => {
  try {
    const userDoc = doc(db, "users", user.userId);
    await setDoc(userDoc, {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      createdAt: serverTimestamp(),
      isActive: true,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return null;

    return {
      ...(userDoc.data() as User),
      userId: userDoc.id,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as User),
      userId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: EditableUserProfile
): Promise<void> => {
  try {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, updates);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const getActiveUsers = async (): Promise<User[]> => {
  try {
    const q = query(usersRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as User),
      userId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching active users:", error);
    throw error;
  }
};
