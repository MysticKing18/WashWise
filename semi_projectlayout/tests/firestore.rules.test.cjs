const assert = require("node:assert/strict");
const { initializeApp } = require("firebase/app");
const { getFirestore, connectFirestoreEmulator, doc, collection, getDoc, getDocs,
  query, where, setDoc, updateDoc, addDoc, serverTimestamp, Timestamp,
  terminate, setLogLevel } = require("firebase/firestore");

const project = "demo-washwise-rules";
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
  throw new Error("Run through the local Firestore emulator. Live projects are not supported.");
}
const [hostname, port] = host.split(":");
setLogLevel("silent");
const clients = new Map();
function client(uid) {
  if (clients.has(uid)) return clients.get(uid);
  const app = initializeApp({ projectId: project, apiKey: "demo-key" }, uid || "anonymous");
  const db = getFirestore(app);
  connectFirestoreEmulator(db, hostname, Number(port),
    uid ? { mockUserToken: { sub: uid } } : undefined);
  clients.set(uid, db);
  return db;
}
function field(value) {
  if (value instanceof Timestamp) return { timestampValue: value.toDate().toISOString() };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  return { mapValue: { fields: fields(value) } };
}
function fields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, field(value)]));
}
async function seed(path, data) {
  const response = await fetch(
    "http://" + host + "/v1/projects/" + project + "/databases/(default)/documents/" + path,
    { method: "PATCH", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
      body: JSON.stringify({ fields: fields(data) }) });
  assert(response.ok, await response.text());
}
let passed = 0;
async function check(label, allowed, action) {
  try {
    await action();
    assert(allowed, label + ": unexpectedly allowed");
  } catch (error) {
    if (allowed || error.code !== "permission-denied") throw error;
  }
  passed++;
  console.log("PASS " + label);
}
const time = Timestamp.fromDate(new Date("2026-09-23T00:00:00Z"));
const branch = (id) => ({ branchId: id, name: id, address: "Test address",
  location: { city: "Tagum City", province: "Davao del Norte", mapQuery: "Test" },
  regularPrice: 50, rushPrice: 80, isActive: true, createdAt: time, updatedAt: time });
const profile = (uid) => ({ userId: uid, fullName: uid, email: uid + "@example.test",
  isActive: true, createdAt: time });
const staff = (uid, branchId, role = "staff", isActive = true) => ({
  staffId: uid, fullName: uid, email: uid + "@example.test", branchId,
  role, isActive, createdAt: time, createdBy: "admin" });
const order = (status = "pending_dropoff") => ({
  customerId: "customer", branchId: "branch-a", status, createdAt: time, updatedAt: time,
  ...(status === "pending_dropoff" ? {} : { confirmedPrice: 150 }) });
const newOrder = () => ({ customerId: "customer", branchId: "branch-a",
  priority: "regular", estimatedPrice: 150, status: "pending_dropoff",
  createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const payment = () => ({ orderId: "ready-a", customerId: "customer", branchId: "branch-a",
  staffId: "staff-a", amountCollected: 150, status: "verified", verifiedAt: serverTimestamp() });
const notification = () => ({ userId: "customer", orderId: "ready-a", type: "order_ready",
  message: "Your laundry is ready for pickup.", isRead: false, createdAt: serverTimestamp() });
async function main() {
  for (const id of ["branch-a", "branch-b"]) await seed("branches/" + id, branch(id));
  for (const uid of ["customer", "other", "staff-b"]) await seed("users/" + uid, profile(uid));
  await seed("staffAccounts/admin", staff("admin", "branch-a", "admin"));
  await seed("staffAccounts/staff-a", staff("staff-a", "branch-a"));
  await seed("staffAccounts/staff-b", staff("staff-b", "branch-b"));
  await seed("staffAccounts/inactive", staff("inactive", "branch-a", "staff", false));
  for (const id of ["pending-a", "cancel-a"]) await seed("orders/" + id, order());
  await seed("orders/ready-a", order("ready"));
  await seed("orders/staff-as-customer", { ...order("ready"), customerId: "staff-b" });

  const customer = client("customer"), other = client("other"), a = client("staff-a");
  const b = client("staff-b"), admin = client("admin"), inactive = client("inactive");
  await check("anonymous branch read denied", false, () => getDoc(doc(client(""), "branches/branch-a")));
  await check("customer branch read", true, () => getDoc(doc(customer, "branches/branch-a")));
  await check("customer branch edit denied", false, () => updateDoc(doc(customer, "branches/branch-a"), { regularPrice: 1 }));
  await check("admin branch create", true, () => setDoc(doc(admin, "branches/branch-c"), branch("branch-c")));
  const typo = branch("branch-typo"); typo.rishPrice = typo.rushPrice; delete typo.rushPrice;
  await check("misspelled price rejected", false, () => setDoc(doc(admin, "branches/branch-typo"), typo));
  await check("own profile update", true, () => updateDoc(doc(customer, "users/customer"), { fullName: "Customer Name" }));
  await check("other customer profile denied", false, () => getDoc(doc(other, "users/customer")));
  await check("profile role injection denied", false, () => updateDoc(doc(customer, "users/customer"), { role: "admin" }));
  await check("customer staff self-enrolment denied", false, () => setDoc(doc(customer, "staffAccounts/customer"), staff("customer", "branch-a", "admin")));
  await check("staff branch self-change denied", false, () => updateDoc(doc(a, "staffAccounts/staff-a"), { branchId: "branch-b" }));
  await check("inactive staff order read denied", false, () => getDoc(doc(inactive, "orders/pending-a")));
  await check("other branch order read denied", false, () => getDoc(doc(b, "orders/pending-a")));
  await check("customer creates pending order", true, () => addDoc(collection(customer, "orders"), newOrder()));
  await check("customer sets confirmed price denied", false, () => addDoc(collection(customer, "orders"), { ...newOrder(), confirmedPrice: 1 }));
  await check("forged order customer denied", false, () => addDoc(collection(customer, "orders"), { ...newOrder(), customerId: "other" }));
  await check("customer changes status to ready denied", false, () => updateDoc(doc(customer, "orders/pending-a"), { status: "ready", updatedAt: serverTimestamp() }));
  await check("customer price edit denied", false, () => updateDoc(doc(customer, "orders/pending-a"), { estimatedPrice: 1, updatedAt: serverTimestamp() }));
  await check("customer pending cancellation", true, () => updateDoc(doc(customer, "orders/cancel-a"), { status: "cancelled", cancelReason: "Changed plans", updatedAt: serverTimestamp() }));
  await check("staff confirms drop-off price", true, () => updateDoc(doc(a, "orders/pending-a"), { confirmedPrice: 150, updatedAt: serverTimestamp() }));
  await check("staff receives order", true, () => updateDoc(doc(a, "orders/pending-a"), { status: "received", updatedAt: serverTimestamp() }));
  await check("skipping processing stages denied", false, () => updateDoc(doc(a, "orders/pending-a"), { status: "ready", updatedAt: serverTimestamp() }));
  await check("other branch update denied", false, () => updateDoc(doc(b, "orders/pending-a"), { status: "washing", updatedAt: serverTimestamp() }));
  for (const status of ["washing", "drying", "ready"]) {
    await check("staff advances to " + status, true, () => updateDoc(doc(a, "orders/pending-a"), { status, updatedAt: serverTimestamp() }));
  }
  await check("customer payment write denied", false, () => addDoc(collection(customer, "payments"), { ...payment(), staffId: "customer" }));
  await check("other branch payment denied", false, () => addDoc(collection(b, "payments"), { ...payment(), staffId: "staff-b" }));
  await check("staff customer cannot collect at other branch", false, () => addDoc(collection(b, "payments"), { ...payment(), orderId: "staff-as-customer", customerId: "staff-b", staffId: "staff-b" }));
  await check("wrong payment amount denied", false, () => addDoc(collection(a, "payments"), { ...payment(), amountCollected: 1 }));
  await check("forged payment collector denied", false, () => addDoc(collection(a, "payments"), { ...payment(), staffId: "admin" }));
  await check("staff pickup payment", true, () => setDoc(doc(a, "payments/paid-a"), payment()));
  await check("payment edit denied", false, () => updateDoc(doc(a, "payments/paid-a"), { amountCollected: 1 }));
  await check("customer payment lookup by order", true, () => getDocs(query(collection(customer, "payments"), where("orderId", "==", "ready-a"))));
  await check("assigned staff payment lookup by order", true, () => getDocs(query(collection(a, "payments"), where("orderId", "==", "ready-a"))));
  await check("other customer payment lookup denied", false, () => getDocs(query(collection(other, "payments"), where("orderId", "==", "ready-a"))));
  await check("staff ready notification", true, () => setDoc(doc(a, "notifications/notice-a"), notification()));
  await check("forged notification recipient denied", false, () => addDoc(collection(a, "notifications"), { ...notification(), userId: "other" }));
  await check("other branch notification denied", false, () => addDoc(collection(b, "notifications"), notification()));
  await check("customer marks notification read", true, () => updateDoc(doc(customer, "notifications/notice-a"), { isRead: true }));
  await check("customer edits notification text denied", false, () => updateDoc(doc(customer, "notifications/notice-a"), { message: "Forged" }));
  await check("customer notification query", true, () => getDocs(query(collection(customer, "notifications"), where("userId", "==", "customer"))));
  await check("customer order query", true, () => getDocs(query(collection(customer, "orders"), where("customerId", "==", "customer"))));
  await check("staff branch order query", true, () => getDocs(query(collection(a, "orders"), where("branchId", "==", "branch-a"))));
  await check("customer reading all orders denied", false, () => getDocs(collection(customer, "orders")));
  console.log("\n" + passed + " Firestore access checks passed.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await Promise.all([...clients.values()].map((db) => terminate(db))); });

