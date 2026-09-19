import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { StaffAccount } from "../models/StaffAccount";

const staffAccountsRef = collection(db, "staffAccounts");

export const createStaffAccount = async (staff: StaffAccount): Promise<void> => {
  try {
    const staffDoc = doc(db, "staffAccounts", staff.staffId);
    await setDoc(staffDoc, {
      ...staff,
      createdAt: staff.createdAt || serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating staff account:", error);
    throw error;
  }
};

export const getStaffById = async (staffId: string): Promise<StaffAccount | null> => {
  try {
    const staffDoc = await getDoc(doc(db, "staffAccounts", staffId));
    if (!staffDoc.exists()) return null;

    return {
      ...(staffDoc.data() as StaffAccount),
      staffId: staffDoc.id,
    };
  } catch (error) {
    console.error("Error fetching staff account:", error);
    throw error;
  }
};

export const getAllStaff = async (): Promise<StaffAccount[]> => {
  try {
    const snapshot = await getDocs(staffAccountsRef);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as StaffAccount),
      staffId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching all staff:", error);
    throw error;
  }
};

export const getStaffByBranch = async (branchId: string): Promise<StaffAccount[]> => {
  try {
    const q = query(staffAccountsRef, where("branchId", "==", branchId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as StaffAccount),
      staffId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching staff by branch:", error);
    throw error;
  }
};

export const getActiveStaff = async (): Promise<StaffAccount[]> => {
  try {
    const q = query(staffAccountsRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as StaffAccount),
      staffId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching active staff:", error);
    throw error;
  }
};

export const updateStaffStatus = async (
  staffId: string,
  isActive: boolean
): Promise<void> => {
  try {
    const staffDoc = doc(db, "staffAccounts", staffId);
    await updateDoc(staffDoc, { isActive });
  } catch (error) {
    console.error("Error updating staff status:", error);
    throw error;
  }
};
