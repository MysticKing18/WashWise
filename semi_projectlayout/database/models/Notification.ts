import { Timestamp } from "firebase/firestore";

export type NotificationType =
  | "order_ready"
  | "order_update"
  | "new_order"
  | "order_cancelled"
  | "payment_verified"
  | "staff_change"
  | "branch_change";

export type NotificationRecipientRole = "customer" | "staff" | "admin";
export type NotificationRecipientScope = "user" | "branch" | "broadcast";

export type NotificationTarget = "order" | "payment" | "management";

export interface Notification {
  notificationId: string;
  userId: string;
  recipientRole: NotificationRecipientRole;
  recipientScope: NotificationRecipientScope;
  branchId?: string;
  orderId?: string;
  paymentId?: string;
  target?: NotificationTarget;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}
