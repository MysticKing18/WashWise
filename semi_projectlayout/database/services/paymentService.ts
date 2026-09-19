import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { Payment } from "../models/Payment";

const paymentsRef = collection(db, "payments");

export const createPayment = async (payment: Omit<Payment, "paymentId" | "verifiedAt">): Promise<string> => {
  try {
    const paymentDoc = await addDoc(paymentsRef, {
      ...payment,
      status: "verified",
      verifiedAt: serverTimestamp(),
    });
    return paymentDoc.id;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const getPaymentByOrder = async (orderId: string): Promise<Payment | null> => {
  try {
    const q = query(paymentsRef, where("orderId", "==", orderId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const paymentDoc = snapshot.docs[0];
    return {
      ...(paymentDoc.data() as Payment),
      paymentId: paymentDoc.id,
    };
  } catch (error) {
    console.error("Error fetching payment by order:", error);
    throw error;
  }
};

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const snapshot = await getDocs(paymentsRef);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Payment),
      paymentId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
};

export const getPaymentsByBranch = async (branchId: string): Promise<Payment[]> => {
  try {
    const q = query(paymentsRef, where("branchId", "==", branchId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Payment),
      paymentId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching payments by branch:", error);
    throw error;
  }
};

export const getPaymentsByStaff = async (staffId: string): Promise<Payment[]> => {
  try {
    const q = query(paymentsRef, where("staffId", "==", staffId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Payment),
      paymentId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching payments by staff:", error);
    throw error;
  }
};
