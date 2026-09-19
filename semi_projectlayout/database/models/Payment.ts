import { Timestamp } from "firebase/firestore";

export type PaymentStatus = "verified";

export interface Payment {
  paymentId: string;
  orderId: string;
  customerId: string;
  staffId: string;
  branchId: string;
  amountCollected: number;
  status: PaymentStatus;
  verifiedAt: Timestamp;
}
