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
import { auth } from "../../firebase/firebase";
import { Order, OrderStatus } from "../models/Order";
import { notifyBranchStaff, notifyCustomer } from "./notificationService";

const ordersRef = collection(db, "orders");

export const createOrder = async (order: Omit<Order, "orderId" | "status" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const newOrderRef = await addDoc(ordersRef, {
      ...order,
      status: "pending_dropoff" as OrderStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await notifyBranchStaff(order.branchId, newOrderRef.id, "new_order", "A new laundry order is waiting for your branch.");
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
    const existingOrder = await getOrderById(orderId);
    const orderDoc = doc(db, "orders", orderId);
    await updateDoc(orderDoc, {
      status,
      updatedAt: serverTimestamp(),
    });
    if (existingOrder && (status === "received" || status === "washing" || status === "completed")) {
      const message = status === "received"
        ? "Your laundry has been received by the branch."
        : status === "washing"
          ? "Your laundry is now being washed."
          : "Your laundry is complete and ready for pickup.";
      await notifyCustomer(existingOrder.customerId, orderId, existingOrder.branchId, status === "completed" ? "order_ready" : "order_update", message);
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const updateBranchOrderStatus = async (
  orderId: string,
  branchId: string,
  status: OrderStatus
): Promise<void> => {
  const order = await getOrderById(orderId);
  if (!order || order.branchId !== branchId) {
    throw new Error("This order does not belong to your assigned branch.");
  }
  await updateOrderStatus(orderId, status);
};

export const cancelOrder = async (
  orderId: string,
  reason?: string
): Promise<void> => {
  try {
    const existingOrder = await getOrderById(orderId);
    const orderDoc = doc(db, "orders", orderId);
    await updateDoc(orderDoc, {
      status: "cancelled",
      cancelReason: reason || "Cancelled by authorized user",
      updatedAt: serverTimestamp(),
    });
    if (existingOrder) {
      const message = `Order ${orderId} was cancelled. ${reason || ""}`.trim();
      if (auth.currentUser?.uid === existingOrder.customerId) {
        await notifyBranchStaff(existingOrder.branchId, orderId, "order_cancelled", message);
      } else {
        await notifyCustomer(existingOrder.customerId, orderId, existingOrder.branchId, "order_cancelled", message);
      }
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
};
