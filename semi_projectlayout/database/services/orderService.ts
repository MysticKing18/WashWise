import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { Order, OrderStatus } from "../models/Order";

const ordersRef = collection(db, "orders");

export const createOrder = async (order: Omit<Order, "orderId" | "status" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const newOrderRef = await addDoc(ordersRef, {
      ...order,
      status: "pending_dropoff" as OrderStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newOrderRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) return null;

    return {
      ...(orderDoc.data() as Order),
      orderId: orderDoc.id,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

export const getCustomerOrders = async (customerId: string): Promise<Order[]> => {
  try {
    const q = query(ordersRef, where("customerId", "==", customerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Order),
      orderId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    throw error;
  }
};

export const getBranchOrders = async (branchId: string): Promise<Order[]> => {
  try {
    const q = query(ordersRef, where("branchId", "==", branchId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Order),
      orderId: docSnap.id,
    }));
  } catch (error) {
    console.error("Error fetching branch orders:", error);
    throw error;
  }
};

export const updateVerifiedOrderDetails = async (
  orderId: string,
  updates: Partial<Pick<Order, "serviceType" | "priority" | "laundryDetails" | "estimatedPrice" | "confirmedPrice">>
): Promise<void> => {
  try {
    const orderDoc = doc(db, "orders", orderId);
    await updateDoc(orderDoc, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating verified order details:", error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<void> => {
  try {
    const orderDoc = doc(db, "orders", orderId);
    await updateDoc(orderDoc, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const cancelOrder = async (
  orderId: string,
  reason?: string
): Promise<void> => {
  try {
    const orderDoc = doc(db, "orders", orderId);
    await updateDoc(orderDoc, {
      status: "cancelled",
      cancelReason: reason || "Cancelled by authorized user",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
};
