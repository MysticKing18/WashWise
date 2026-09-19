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

export const createUser = async (user: User): Promise<void> => {
  try {
    const userDoc = doc(db, "users", user.userId);
    await setDoc(userDoc, {
      ...user,
      createdAt: user.createdAt || serverTimestamp(),
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
  updates: Partial<Omit<User, "userId" | "createdAt">>
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
