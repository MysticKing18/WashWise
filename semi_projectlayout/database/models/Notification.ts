import { Timestamp } from "firebase/firestore";

export type NotificationType = "order_ready" | "order_update";

export interface Notification {
  notificationId: string;
  userId: string;
  orderId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}
