import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { Notification } from "../models/Notification";

const notificationsRef = collection(db, "notifications");

export const createNotification = async (
  notification: Omit<Notification, "notificationId" | "createdAt">
): Promise<string> => {
  try {
    const notificationDoc = await addDoc(notificationsRef, {
      ...notification,
      createdAt: serverTimestamp(),
    });
    return notificationDoc.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(notificationsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Notification),
      notificationId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationDoc = doc(db, "notifications", notificationId);
    await updateDoc(notificationDoc, { isRead: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};
