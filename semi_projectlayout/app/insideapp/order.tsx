import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ImageSourcePropType,
  ImageStyle,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
} from "react-native";
import { auth } from "../../firebase/firebase";
import {
  cancelOrder,
  getCustomerOrders,
} from "../../database/services/orderService";
import { getBranchById } from "../../database/services/branchService";
import type { Order, OrderStatus } from "../../database/models/Order";

const { height } = Dimensions.get("window");
const progressSteps: Array<{ status: OrderStatus; label: string }> = [
  { status: "pending_dropoff", label: "Pending Drop-off" },
  { status: "received", label: "Received" },
  { status: "washing", label: "Washing" },
  { status: "completed", label: "Completed" },
];

type FloatingBubbleProps = {
  source: ImageSourcePropType;
  size: number;
  style?: StyleProp<ImageStyle>;
  duration?: number;
  opacity?: number;
};

function FloatingBubble({
  source,
  size,
  style,
  duration = 4000,
  opacity = 0.85,
}: FloatingBubbleProps) {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, floatAnim]);
  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[
        styles.backgroundBubble,
        { width: size, height: size, opacity, transform: [{ translateY }] },
        style,
      ]}
    />
  );
}

const statusLabel = (status: OrderStatus) =>
  status === "pending_dropoff"
    ? "Pending Drop-off"
    : status
        .replace("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
const priceFor = (order: Order) => order.confirmedPrice ?? order.estimatedPrice;
const progressIndex = (status: OrderStatus) =>
  progressSteps.findIndex((step) => step.status === status);

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled")
    return (
      <View style={styles.cancelledBanner}>
        <Ionicons name="close-circle" size={15} color="#AF3546" />
        <Text style={styles.cancelledText}>Order cancelled</Text>
      </View>
    );
  const activeIndex = progressIndex(status);
  return (
    <View style={styles.progress}>
      {progressSteps.map((step, index) => (
        <View key={step.status} style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              index <= activeIndex && styles.progressDotActive,
            ]}
          >
            {index <= activeIndex ? (
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            ) : null}
          </View>
          <Text
            style={[
              styles.progressLabel,
              index <= activeIndex && styles.progressLabelActive,
            ]}
          >
            {step.label}
          </Text>
          {index < progressSteps.length - 1 ? (
            <View
              style={[
                styles.progressLine,
                index < activeIndex && styles.progressLineActive,
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default function CustomerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branchNames, setBranchNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadOrders = async (isRefresh = false) => {
    const customerId = auth.currentUser?.uid;
    if (!customerId) {
      setError("Please sign in again to view your orders.");
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const customerOrders = await getCustomerOrders(customerId);
      const uniqueBranchIds = [
        ...new Set(customerOrders.map((order) => order.branchId)),
      ];
      const branchEntries = await Promise.all(
        uniqueBranchIds.map(
          async (branchId) =>
            [
              branchId,
              (await getBranchById(branchId))?.name || branchId,
            ] as const,
        ),
      );
      setOrders(
        customerOrders.sort(
          (left, right) =>
            right.createdAt.toMillis() - left.createdAt.toMillis(),
        ),
      );
      setBranchNames(Object.fromEntries(branchEntries));
    } catch {
      setError(
        "Could not load your orders. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, []),
  );

  const requestCancellation = (order: Order) => setCancellingId(order.orderId);

  const confirmCancellation = async () => {
    const order = orders.find((item) => item.orderId === cancellingId);
    if (!order || order.status !== "pending_dropoff") return;
    try {
      await cancelOrder(order.orderId, "Cancelled by customer");
      setOrders((items) =>
        items.map((item) =>
          item.orderId === order.orderId
            ? {
                ...item,
                status: "cancelled",
                cancelReason: "Cancelled by customer",
              }
            : item,
        ),
      );
    } catch {
      setError(
        "This order could not be cancelled. It may already have been received by staff.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const closeCancellation = () => setCancellingId(null);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#BFE6FB", "#E8F7FD", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />
      <FloatingBubble
        source={require("../../assets/img/bubble1.png")}
        size={74}
        style={{ top: height * 0.04, left: -24 }}
        opacity={0.5}
      />
      <FloatingBubble
        source={require("../../assets/img/bubble2.png")}
        size={46}
        style={{ top: height * 0.08, right: 18 }}
        opacity={0.5}
      />
      <FloatingBubble
        source={require("../../assets/img/bubble2.png")}
        size={108}
        style={{ top: height * 0.18, right: -38 }}
        opacity={0.42}
      />
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back to home"
            onPress={() => router.replace("/insideapp/home")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#0E6BB7" />
          </Pressable>
          <Text style={styles.title}>My Orders</Text>
          <Pressable
            accessibilityLabel="Refresh orders"
            onPress={() => void loadOrders(true)}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh-outline" size={19} color="#0E6BB7" />
          </Pressable>
        </View>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.sectionTitle}>Track your laundry</Text>
            <Text style={styles.subtitle}>
              View the latest progress of your orders.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/insideapp/branches")}
            style={styles.newOrderButton}
          >
            <Ionicons name="add" size={14} color="#FFFFFF" />
            <Text style={styles.newOrderText}>New Order</Text>
          </Pressable>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <Text style={styles.empty}>Loading your orders...</Text>
        ) : orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={34} color="#0877D1" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              Pick a branch to place your first laundry order.
            </Text>
            <Pressable
              onPress={() => router.push("/insideapp/branches")}
              style={styles.pickButton}
            >
              <Text style={styles.pickButtonText}>Pick Branch / Main</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {orders.map((order) => (
              <View key={order.orderId} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>{order.orderId}</Text>
                    <Text style={styles.branch}>
                      {branchNames[order.branchId] || order.branchId}
                    </Text>
                  </View>
                  <Text style={styles.status}>{statusLabel(order.status)}</Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>
                  {order.serviceType || "Laundry service"} -{" "}
                  {order.priority === "rush" ? "Rush" : "Regular"}
                </Text>
                <Text style={styles.detailLabel}>Laundry details</Text>
                <Text style={styles.detailValue}>
                  {order.laundryDetails || "No additional details provided."}
                </Text>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.amount}>
                  {priceFor(order) === undefined
                    ? "To be confirmed"
                    : `P${priceFor(order)?.toFixed(2)}`}
                </Text>
                <OrderProgress status={order.status} />
                {order.status === "pending_dropoff" ? (
                  <Pressable
                    disabled={cancellingId === order.orderId}
                    onPress={() => requestCancellation(order)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Order</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <Modal
        transparent
        visible={!!cancellingId}
        animationType="fade"
        onRequestClose={closeCancellation}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-circle-outline" size={28} color="#AF3546" />
            </View>
            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalMessage}>
              This order is still pending drop-off. Do you want to cancel it?
            </Text>
            <View style={styles.modalActions}>
              <Pressable onPress={closeCancellation} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Keep Order</Text>
              </Pressable>
              <Pressable
                onPress={() => void confirmCancellation()}
                style={styles.modalConfirm}
              >
                <Text style={styles.modalConfirmText}>Cancel Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/insideapp/home")}
        >
          <Ionicons name="home" size={24} color="#64748B" />
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/insideapp/order")}
        >
          <Ionicons name="receipt-outline" size={24} color="#2563EB" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Order</Text>
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
  backgroundBubble: { position: "absolute" },
  content: { flex: 1, paddingHorizontal: 10, paddingBottom: 10 },
  topBar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#075191", fontSize: 15, fontWeight: "800" },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: { color: "#034C8A", fontSize: 14, fontWeight: "800" },
  subtitle: { marginTop: 3, color: "#6B879B", fontSize: 9 },
  newOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    height: 29,
    borderRadius: 6,
    backgroundColor: "#0877D1",
  },
  newOrderText: { color: "#FFFFFF", fontSize: 8, fontWeight: "800" },
  error: {
    padding: 9,
    borderRadius: 6,
    color: "#AF3546",
    backgroundColor: "#FFF0F1",
    fontSize: 9,
    marginBottom: 8,
  },
  empty: { marginTop: 28, color: "#6B879B", fontSize: 10, textAlign: "center" },
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
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 5,
    color: "#6B879B",
    fontSize: 10,
    textAlign: "center",
  },
  pickButton: {
    height: 34,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    borderRadius: 7,
    backgroundColor: "#0877D1",
  },
  pickButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  list: { paddingBottom: 12 },
  orderCard: {
    padding: 11,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D3E3EC",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderId: { color: "#075191", fontSize: 10, fontWeight: "800" },
  branch: { marginTop: 3, color: "#527B9A", fontSize: 9 },
  status: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    color: "#0877C8",
    backgroundColor: "#DDF1FF",
    fontSize: 8,
    fontWeight: "800",
  },
  divider: { height: 1, marginVertical: 8, backgroundColor: "#E5EDF2" },
  detailLabel: {
    marginTop: 5,
    color: "#7B93A0",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  detailValue: { marginTop: 2, color: "#395E73", fontSize: 9 },
  amount: { marginTop: 2, color: "#075191", fontSize: 12, fontWeight: "800" },
  progress: { flexDirection: "row", alignItems: "flex-start", marginTop: 15 },
  progressStep: { flex: 1, alignItems: "center", position: "relative" },
  progressDot: {
    width: 19,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#D8E4EA",
  },
  progressDotActive: { backgroundColor: "#0877D1" },
  progressLabel: {
    marginTop: 4,
    color: "#8B9AA7",
    fontSize: 6,
    textAlign: "center",
  },
  progressLabelActive: { color: "#0877C8", fontWeight: "800" },
  progressLine: {
    position: "absolute",
    top: 9,
    left: "58%",
    width: "84%",
    height: 2,
    backgroundColor: "#D8E4EA",
  },
  progressLineActive: { backgroundColor: "#0877D1" },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 7,
    marginTop: 14,
    borderRadius: 6,
    backgroundColor: "#FFE1E4",
  },
  cancelledText: { color: "#AF3546", fontSize: 8, fontWeight: "800" },
  cancelButton: {
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E29AA3",
  },
  cancelButtonText: { color: "#AF3546", fontSize: 9, fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(6, 30, 50, 0.42)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    padding: 22,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  modalIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: "#FFF0F1",
  },
  modalTitle: {
    marginTop: 12,
    color: "#073D91",
    fontSize: 19,
    fontWeight: "800",
  },
  modalMessage: {
    marginTop: 7,
    color: "#7187AD",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  modalActions: { width: "100%", flexDirection: "row", gap: 10, marginTop: 18 },
  modalCancel: {
    flex: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#B4C6D9",
  },
  modalCancelText: { color: "#6E84A7", fontSize: 10, fontWeight: "700" },
  modalConfirm: {
    flex: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#E8424E",
  },
  modalConfirmText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
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
  activeNavLabel: { color: "#2563EB", fontWeight: "700" },
});
