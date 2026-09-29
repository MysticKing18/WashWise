import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { CreatePaymentInput, Payment } from "../models/Payment";
import { notifyAdmins, notifyCustomer } from "./notificationService";

const paymentsRef = collection(db, "payments");

export const createPayment = async (payment: CreatePaymentInput): Promise<string> => {
  try {
    const paymentDoc = doc(paymentsRef);
    await setDoc(paymentDoc, {
      ...payment,
      paymentId: paymentDoc.id,
      status: "verified",
      verifiedAt: serverTimestamp(),
    });
    await notifyCustomer(payment.customerId, payment.orderId, payment.branchId, "payment_verified", "Your payment has been verified by the branch.", "payment", paymentDoc.id);
    await notifyAdmins("payment_verified", `Payment for order ${payment.orderId} was verified.`, payment.branchId, payment.orderId, paymentDoc.id);
    return paymentDoc.id;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const getPaymentByOrder = async (orderId: string, branchId: string): Promise<Payment | null> => {
  try {
    const q = query(paymentsRef, where("branchId", "==", branchId));
    const snapshot = await getDocs(q);

    const paymentDoc = snapshot.docs.find((docSnap) => docSnap.data().orderId === orderId);
    if (!paymentDoc) return null;

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
