import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth } from "../../firebase/firebase";
import { getBranchById } from "../../database/services/branchService";
import { getCustomerOrders } from "../../database/services/orderService";
import type { Order } from "../../database/models/Order";

const statusLabel = (status: Order["status"]) =>
  status === "cancelled" ? "Cancelled" : "Completed";

export default function CustomerHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branchNames, setBranchNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    const customerId = auth.currentUser?.uid;
    if (!customerId) {
      setError("Please sign in again to view your history.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const customerOrders = await getCustomerOrders(customerId);
      const history = customerOrders.filter(
        (order) => order.status === "completed" || order.status === "cancelled",
      );
      const branchEntries = await Promise.all(
        [...new Set(history.map((order) => order.branchId))].map(
          async (branchId) =>
            [
              branchId,
              (await getBranchById(branchId))?.name?.trim() || "Branch name unavailable",
            ] as const,
        ),
      );
      setOrders(
        history.sort(
          (left, right) =>
            right.createdAt.toMillis() - left.createdAt.toMillis(),
        ),
      );
      setBranchNames(Object.fromEntries(branchEntries));
    } catch {
      setError(
        "Could not load your order history. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, []),
  );

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#BFE6FB", "#E8F7FD", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.replace("/insideapp/home")}
            accessibilityLabel="Go back to home"
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={22} color="#0E6BB7" />
          </Pressable>
          <Text style={styles.title}>Order History</Text>
          <Pressable
            onPress={() => void loadHistory()}
            accessibilityLabel="Refresh order history"
            style={styles.iconButton}
          >
            <Ionicons name="refresh-outline" size={22} color="#0E6BB7" />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Completed and cancelled orders</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <Text style={styles.empty}>Loading order history...</Text>
        ) : orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={32} color="#0877D1" />
            <Text style={styles.emptyTitle}>No order history yet</Text>
            <Text style={styles.emptyText}>
              Completed and cancelled orders will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {orders.map((order) => (
              <View key={order.orderId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeading}>
                    <Text style={styles.orderId}>{order.orderId}</Text>
                    <Text style={styles.branch}>
                      {branchNames[order.branchId] || "Branch name unavailable"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.status,
                      order.status === "cancelled"
                        ? styles.cancelled
                        : styles.completed,
                    ]}
                  >
                    {statusLabel(order.status)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.label}>Service</Text>
                <Text style={styles.value}>
                  {order.serviceType || "Laundry service"} -{" "}
                  {order.priority === "rush" ? "Rush" : "Regular"}
                </Text>
                <Text style={styles.label}>Laundry details</Text>
                <Text style={styles.value}>
                  {order.laundryDetails || "No additional details provided."}
                </Text>
                <Text style={styles.label}>Amount</Text>
                <Text style={styles.amount}>
                  {order.confirmedPrice === undefined
                    ? "Not set"
                    : `P${order.confirmedPrice.toFixed(2)}`}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/insideapp/home")}
        >
          <Ionicons name="home-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/insideapp/order")}
        >
          <Ionicons name="receipt-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Order</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/insideapp/branches")}
        >
          <Ionicons name="git-network-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Branches</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/insideapp/profile")}
        >
          <Ionicons name="person-circle-outline" size={25} color="#64748B" />
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 },
  topBar: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C5DDEB",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: "#075191",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#6B879B",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 18,
  },
  error: {
    padding: 12,
    borderRadius: 10,
    color: "#AF3546",
    backgroundColor: "#FFF0F1",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  empty: { marginTop: 28, color: "#6B879B", fontSize: 13, lineHeight: 20, textAlign: "center" },
  emptyCard: {
    alignItems: "center",
    padding: 22,
    marginTop: 22,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D3E3EC",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  emptyTitle: {
    marginTop: 10,
    color: "#075191",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 8,
    color: "#6B879B",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  list: { paddingBottom: 12 },
  card: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D3E3EC",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardHeading: { flex: 1, minWidth: 0 },
  orderId: { color: "#075191", fontSize: 13, lineHeight: 18, fontWeight: "800" },
  branch: { marginTop: 5, color: "#527B9A", fontSize: 12, lineHeight: 18 },
  status: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  completed: { color: "#15914D", backgroundColor: "#D8F6E4" },
  cancelled: { color: "#AF3546", backgroundColor: "#FFE1E4" },
  divider: { height: 1, marginVertical: 12, backgroundColor: "#E5EDF2" },
  label: {
    marginTop: 8,
    color: "#7B93A0",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  value: { marginTop: 4, color: "#395E73", fontSize: 12, lineHeight: 18 },
  amount: { marginTop: 4, color: "#075191", fontSize: 16, lineHeight: 22, fontWeight: "800" },
  bottomNav: {
    height: 58,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#D7E5EE",
  },
  navItem: { minWidth: 52, alignItems: "center", justifyContent: "center" },
  navLabel: { marginTop: 3, color: "#64748B", fontSize: 10 },
});
