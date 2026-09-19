import { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending_dropoff"
  | "received"
  | "washing"
  | "drying"
  | "ready"
  | "completed"
  | "cancelled";

export interface Order {
  orderId: string;
  customerId: string;
  branchId: string;
  serviceType?: string;
  priority?: "regular" | "rush";
  laundryDetails?: string;
  estimatedPrice?: number;
  confirmedPrice?: number;
  status: OrderStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelReason?: string;
}
