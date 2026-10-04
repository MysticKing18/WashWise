import { Timestamp } from "firebase/firestore";

export interface BranchLocation {
  city: string;
  province: string;
  barangay?: string;
  landmark?: string;
  mapQuery?: string;
  latitude?: number;
  longitude?: number;
}

export interface Branch {
  branchId: string;
  name: string;
  address: string;
  photoUrl?: string;
  location?: BranchLocation;
  contactPhone?: string;
  regularPrice: number;
  rushPrice: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
