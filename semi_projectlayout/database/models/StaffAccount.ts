import { Timestamp } from "firebase/firestore";

export type StaffRole = "staff" | "admin";

export interface StaffAccount {
  staffId: string;
  fullName: string;
  email: string;
  role: StaffRole;
  branchId: string;
  createdBy: string;
  createdAt: Timestamp;
  isActive: boolean;
}
