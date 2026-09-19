import { Timestamp } from "firebase/firestore";

export interface Branch {
  branchId: string;
  name: string;
  address: string;
  photoUrl?: string;
  regularPrice: number;
  rushPrice: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
