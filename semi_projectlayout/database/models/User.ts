import { Timestamp } from "firebase/firestore";

export interface User {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  createdAt: Timestamp;
  isActive: boolean;
}
