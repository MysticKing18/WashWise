import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { Notification, NotificationTarget } from "../models/Notification";

const notificationsRef = collection(db, "notifications");

export type NewNotification = Omit<Notification, "notificationId" | "createdAt">;

export const createNotification = async (notification: NewNotification, uniqueKey?: string): Promise<string> => {
  try {
    const notificationDoc = uniqueKey ? doc(db, "notifications", uniqueKey) : doc(notificationsRef);
    await setDoc(notificationDoc, {
      ...notification,
      notificationId: notificationDoc.id,
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
    })).sort((left, right) => right.createdAt.toMillis() - left.createdAt.toMillis());
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
};

export const getStaffNotifications = async (staffId: string, branchId: string): Promise<Notification[]> => {
const [direct, branch] = await Promise.all([
  getDocs(
    query(notificationsRef, where("userId", "==", staffId))
  ),
  getDocs(
    query(
      notificationsRef,
      where("branchId", "==", branchId),
      where("recipientRole", "==", "staff"),
      where("recipientScope", "==", "branch")
    )
  ),
]);
  return [...direct.docs, ...branch.docs].map((docSnap) => ({
    ...(docSnap.data() as Notification),
    notificationId: docSnap.id,
  })).filter((notification) => (notification.recipientScope === "user" && notification.userId === staffId)
    || (notification.recipientScope === "branch" && notification.branchId === branchId))
    .sort((left, right) => right.createdAt.toMillis() - left.createdAt.toMillis());
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const notifications = await getUserNotifications(userId);
  return notifications.filter((notification) => !notification.isRead).length;
};

export const getStaffUnreadNotificationCount = async (staffId: string, branchId: string): Promise<number> => {
  const notifications = await getStaffNotifications(staffId, branchId);
  return notifications.filter((notification) => !notification.isRead).length;
};

export const getAdminNotifications = async (): Promise<Notification[]> => {
  const snapshot = await getDocs(
  query(
    notificationsRef,
    where("userId", "==", "admins"),
    where("recipientRole", "==", "admin"),
    where("recipientScope", "==", "broadcast")
  )
);
  return snapshot.docs.map((docSnap) => ({
    ...(docSnap.data() as Notification),
    notificationId: docSnap.id,
  })).filter((notification) => notification.recipientScope === "broadcast")
    .sort((left, right) => right.createdAt.toMillis() - left.createdAt.toMillis());
};

export const getAdminUnreadNotificationCount = async (): Promise<number> => {
  const notifications = await getAdminNotifications();
  return notifications.filter((notification) => !notification.isRead).length;
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

const createNotificationSafely = async (notification: NewNotification, uniqueKey: string): Promise<void> => {
  try {
    await createNotification(notification, uniqueKey);
  } catch (error) {
    console.error("Error creating notification after successful action:", error);
  }
};

export const notifyCustomer = async (customerId: string, orderId: string, branchId: string, type: Notification["type"], message: string, target: NotificationTarget = "order", paymentId?: string): Promise<void> => {
  await createNotificationSafely({ userId: customerId, recipientRole: "customer", recipientScope: "user", branchId, orderId, ...(paymentId ? { paymentId } : {}), target, type, message, isRead: false }, `${type}-customer-${customerId}-${paymentId || orderId}`);
};

export const notifyBranchStaff = async (branchId: string, orderId: string, type: Notification["type"], message: string): Promise<void> => {
  await createNotificationSafely({ userId: branchId, recipientRole: "staff", recipientScope: "branch", branchId, orderId, target: "order", type, message, isRead: false }, `${type}-branch-${branchId}-${orderId}`);
};

export const notifyAdmins = async (type: Notification["type"], message: string, branchId?: string, orderId?: string, paymentId?: string): Promise<void> => {
  try {
    await createNotificationSafely({ userId: "admins", recipientRole: "admin", recipientScope: "broadcast", ...(branchId ? { branchId } : {}), ...(orderId ? { orderId } : {}), ...(paymentId ? { paymentId } : {}), target: paymentId ? "payment" : "management", type, message, isRead: false }, `${type}-admins-${paymentId || orderId || branchId || "global"}`);
  } catch (error) {
    console.error("Error finding admin notification recipients:", error);
  }
};
