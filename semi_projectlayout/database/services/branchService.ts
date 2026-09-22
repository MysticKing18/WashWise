import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { BRANCH_CATALOG } from "../branchCatalog";
import { Branch } from "../models/Branch";

const branchesRef = collection(db, "branches");

export const createBranch = async (branch: Branch): Promise<void> => {
  try {
    const branchDoc = doc(db, "branches", branch.branchId);
    await setDoc(branchDoc, {
      ...branch,
      createdAt: branch.createdAt || serverTimestamp(),
      updatedAt: branch.updatedAt || serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    throw error;
  }
};

export const getBranchById = async (branchId: string): Promise<Branch | null> => {
  try {
    const branchDoc = await getDoc(doc(db, "branches", branchId));
    if (!branchDoc.exists()) return null;

    return {
      ...(branchDoc.data() as Branch),
      branchId: branchDoc.id,
    };
  } catch (error) {
    console.error("Error fetching branch:", error);
    throw error;
  }
};

export const getBranches = async (): Promise<Branch[]> => {
  try {
    const snapshot = await getDocs(branchesRef);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Branch),
      branchId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw error;
  }
};

export const getActiveBranches = async (): Promise<Branch[]> => {
  try {
    const q = query(branchesRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Branch),
      branchId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching active branches:", error);
    throw error;
  }
};

export const subscribeToBranches = (
  onChange: (branches: Branch[]) => void,
  onError: (error: Error) => void,
): (() => void) => onSnapshot(
  query(branchesRef, where("isActive", "==", true)),
  (snapshot) => {
    const savedBranches = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Branch),
        branchId: docSnap.id,
      }));
    onChange(savedBranches.length ? savedBranches : BRANCH_CATALOG);
  },
  onError,
);

export const updateBranch = async (
  branchId: string,
  updates: Partial<Omit<Branch, "branchId" | "createdAt">>
): Promise<void> => {
  try {
    const branchDoc = doc(db, "branches", branchId);
    await updateDoc(branchDoc, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    throw error;
  }
};
