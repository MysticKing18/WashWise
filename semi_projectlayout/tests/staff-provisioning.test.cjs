const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const apps = require("firebase/app");
const authSdk = require("firebase/auth");
const firestore = require("firebase/firestore");

const projectId = "demo-washwise-staff";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
for (const host of [authHost, firestoreHost]) {
  if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
    throw new Error("Run with the local Auth and Firestore emulators. Live projects are not supported.");
  }
}
firestore.setLogLevel("silent");
const app = apps.initializeApp({ projectId, apiKey: "demo-key" }, "staff-test-primary");
const auth = authSdk.initializeAuth(app, { persistence: authSdk.inMemoryPersistence });
authSdk.connectAuthEmulator(auth, "http://" + authHost, { disableWarnings: true });
const db = firestore.getFirestore(app);
const [hostname, port] = firestoreHost.split(":");
firestore.connectFirestoreEmulator(db, hostname, Number(port));

// Transpile the real service and replace only its app configuration with our
// emulator app. Optional SDK faults exercise cross-service failure recovery.
function loadService(overrides = {}, file = "staffProvisioningService", exported = "createStaffLoginAccount") {
  const servicePath = path.resolve(__dirname, `../database/services/${file}.ts`);
  const compiled = ts.transpileModule(fs.readFileSync(servicePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const evaluate = vm.runInThisContext(`(function(exports, require, module) {\n${compiled}\n})`, { filename: servicePath });
  evaluate(module.exports, (name) => {
    if (name === "../../firebase/firebase") return { auth, db };
    if (name === "firebase/auth") return { ...authSdk, ...overrides.auth };
    if (name === "firebase/firestore") return { ...firestore, ...overrides.firestore };
    return require(name);
  }, module);
  return module.exports[exported];
}
function field(value) {
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { doubleValue: value };
  return { stringValue: value };
}
async function seed(documentPath, data) {
  const response = await fetch(`http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents/${documentPath}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, field(value)])) }),
  });
  assert(response.ok, await response.text());
}
async function authUsers() {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchGet?maxResults=1000`, {
    headers: { Authorization: "Bearer owner" },
  });
  const body = await response.json();
  assert(response.ok, JSON.stringify(body));
  return body.users || [];
}
const input = (email, extra = {}) => ({
  fullName: "Carl Test", email, password: "EmulatorTest123!", branchId: "branch-a", ...extra,
});
const firebaseError = (code) => Object.assign(new Error(code), { code });
let passed = 0;
async function check(label, test) {
  await test();
  passed++;
  console.log("PASS " + label);
}
let adminId;
async function seedAdmin(isActive = true, role = "admin") {
  await seed("staffAccounts/" + adminId, {
    staffId: adminId, fullName: "Admin Test", email: "admin@example.test", role,
    branchId: "branch-a", createdBy: "emulator-bootstrap", createdAt: new Date(), isActive,
  });
}
async function main() {
  adminId = (await authSdk.createUserWithEmailAndPassword(auth, "admin@example.test", "AdminTest123!")).user.uid;
  const branch = (isActive) => ({ branchId: "branch-a", name: "Test Branch", address: "Test Address",
    regularPrice: 50, rushPrice: 80, isActive, createdAt: new Date(), updatedAt: new Date() });
  await seed("branches/branch-a", branch(true));
  await seedAdmin();
  const create = loadService();
  const sessions = [];
  const unsubscribe = authSdk.onAuthStateChanged(auth, (user) => sessions.push(user?.uid));
  let staffId;

  await check("creates matching Auth/Firestore staff record while preserving the admin session", async () => {
    staffId = (await create(input("  CARL@example.test  ", { fullName: "  Carl Gadioso  " }))).staffId;
    const snap = await firestore.getDocFromServer(firestore.doc(db, "staffAccounts", staffId));
    const data = snap.data();
    assert.equal(snap.id, staffId);
    assert.equal(data.staffId, staffId);
    assert.equal(data.fullName, "Carl Gadioso");
    assert.equal(data.email, "carl@example.test");
    assert.equal(data.role, "staff");
    assert.equal(data.branchId, "branch-a");
    assert.equal(data.createdBy, adminId);
    assert.equal(data.isActive, true);
    assert(data.createdAt instanceof firestore.Timestamp);
    assert.deepEqual(Object.keys(data).sort(), ["staffId", "fullName", "email", "role", "branchId", "createdBy", "createdAt", "isActive"].sort());
    assert.equal(auth.currentUser.uid, adminId);
    assert(sessions.every(uid => uid === adminId));
    assert.equal(apps.getApps().length, 1, "secondary app was disposed");
  });
  await check("new staff can log in with their temporary password", async () => {
    const loginApp = apps.initializeApp(app.options, "staff-login-check");
    const loginAuth = authSdk.initializeAuth(loginApp, { persistence: authSdk.inMemoryPersistence });
    authSdk.connectAuthEmulator(loginAuth, "http://" + authHost, { disableWarnings: true });
    try {
      const signedIn = await authSdk.signInWithEmailAndPassword(loginAuth, "carl@example.test", "EmulatorTest123!");
      assert.equal(signedIn.user.uid, staffId);
      assert.equal(auth.currentUser.uid, adminId);
    } finally {
      await authSdk.signOut(loginAuth);
      await apps.deleteApp(loginApp);
    }
  });
  await check("duplicate email never replaces an existing login or staff profile", async () => {
    const before = (await authUsers()).length;
    await assert.rejects(create(input("carl@example.test", { fullName: "Replacement Name" })), { code: "auth/email-already-in-use" });
    assert.equal((await authUsers()).length, before);
    assert.equal((await firestore.getDocFromServer(firestore.doc(db, "staffAccounts", staffId))).data().fullName, "Carl Gadioso");
    assert.equal(auth.currentUser.uid, adminId);
  });
  await check("non-admin and inactive admins cannot create Authentication users", async () => {
    const before = (await authUsers()).length;
    await seedAdmin(true, "staff");
    await assert.rejects(create(input("forbidden@example.test")), { code: "staff/admin-required" });
    await seedAdmin(false);
    await assert.rejects(create(input("inactive@example.test")), { code: "staff/admin-required" });
    assert.equal((await authUsers()).length, before);
    await seedAdmin();
  });
  await check("inactive and missing branches are rejected before Auth creation", async () => {
    const before = (await authUsers()).length;
    await seed("branches/branch-a", branch(false));
    await assert.rejects(create(input("badbranch@example.test")), { code: "staff/branch-unavailable" });
    await assert.rejects(create(input("missingbranch@example.test", { branchId: "missing" })), { code: "staff/branch-unavailable" });
    assert.equal((await authUsers()).length, before);
    await seed("branches/branch-a", branch(true));
  });
  await check("simultaneous submissions are blocked", async () => {
    const first = create(input("concurrent@example.test"));
    await assert.rejects(create(input("concurrent2@example.test")), { code: "staff/in-progress" });
    await first;
    assert(!(await authUsers()).some(user => user.email === "concurrent2@example.test"));
  });
  await check("permission loss after Auth creation rolls back only the new login", async () => {
    const guarded = loadService({ auth: {
      createUserWithEmailAndPassword: async (...args) => {
        const created = await authSdk.createUserWithEmailAndPassword(...args);
        await seedAdmin(false);
        return created;
      },
    } });
    await assert.rejects(guarded(input("rollback@example.test")), { code: "staff/profile-rejected" });
    assert(!(await authUsers()).some(user => user.email === "rollback@example.test"));
    assert.equal(auth.currentUser.uid, adminId);
    await seedAdmin();
  });
  await check("a lost write acknowledgement is recovered from the saved profile", async () => {
    const uncertain = loadService({ firestore: {
      runTransaction: async (...args) => {
        await firestore.runTransaction(...args);
        throw firebaseError("unavailable");
      },
    } });
    const saved = await uncertain(input("acknowledgement@example.test"));
    assert((await authUsers()).some(user => user.localId === saved.staffId));
    assert((await firestore.getDocFromServer(firestore.doc(db, "staffAccounts", saved.staffId))).exists());
  });
  await check("an unresolved save preserves the login and reports its UID for recovery", async () => {
    const uncertain = loadService({ firestore: { runTransaction: async () => { throw firebaseError("unavailable"); } } });
    let error;
    try { await uncertain(input("uncertain@example.test")); } catch (caught) { error = caught; }
    assert.equal(error.code, "staff/profile-result-unknown");
    const pending = (await authUsers()).find(user => user.email === "uncertain@example.test");
    assert(pending);
    assert(error.message.includes(pending.localId));
    assert(!(await firestore.getDocFromServer(firestore.doc(db, "staffAccounts", pending.localId))).exists());
    assert.equal(auth.currentUser.uid, adminId);
  });
  await check("failed rollback reports the retained UID without claiming success", async () => {
    const failing = loadService({
      firestore: { runTransaction: async () => { throw firebaseError("permission-denied"); } },
      auth: { deleteUser: async () => { throw firebaseError("auth/network-request-failed"); } },
    });
    let error;
    try { await failing(input("cleanup@example.test")); } catch (caught) { error = caught; }
    assert.equal(error.code, "staff/cleanup-required");
    const pending = (await authUsers()).find(user => user.email === "cleanup@example.test");
    assert(pending && error.message.includes(pending.localId));
  });
  await check("validation does not create accounts and all isolated apps are disposed", async () => {
    const before = (await authUsers()).length;
    await assert.rejects(create(input("invalid@example.test", { fullName: " " })), { code: "staff/invalid-name" });
    await assert.rejects(create(input("invalid@example.test", { password: "123" })), { code: "staff/invalid-password" });
    assert.equal((await authUsers()).length, before);
    assert.equal(apps.getApps().length, 1);
    assert.equal(auth.currentUser.uid, adminId);
    assert(sessions.every(uid => uid === adminId));
  });
  unsubscribe();
  await check("signed-out visitors cannot provision staff", async () => {
    await authSdk.signOut(auth);
    await assert.rejects(create(input("anonymous@example.test")), { code: "staff/admin-required" });
  });
  const signInStaff = loadService({}, "staffAuthenticationService", "signInStaff");
  await check("staff login verifies the created profile and uses the assigned branch", async () => {
    const profile = await signInStaff("  CARL@example.test  ", "EmulatorTest123!");
    assert.equal(profile.staffId, staffId);
    assert.equal(profile.role, "staff");
    assert.equal(profile.branchId, "branch-a");
    assert.equal(auth.currentUser.uid, staffId);
    await authSdk.signOut(auth);
  });
  await check("incorrect credentials fail staff login", async () => {
    await assert.rejects(signInStaff("carl@example.test", "WrongPassword123!"), error => error.code.startsWith("auth/"));
    assert.equal(auth.currentUser, null);
  });
  await check("admin credentials cannot enter through staff login", async () => {
    await assert.rejects(signInStaff("admin@example.test", "AdminTest123!"), { code: "staff/not-staff" });
    assert.equal(auth.currentUser, null);
  });
  await check("a login with no staff profile is signed back out", async () => {
    await assert.rejects(signInStaff("uncertain@example.test", "EmulatorTest123!"), { code: "staff/not-staff" });
    assert.equal(auth.currentUser, null);
  });
  const savedStaff = { staffId, fullName: "Carl Gadioso", email: "carl@example.test", role: "staff", branchId: "branch-a", createdBy: adminId, createdAt: new Date(), isActive: true };
  await check("inactive staff and unassigned staff cannot enter", async () => {
    await seed("staffAccounts/" + staffId, { ...savedStaff, isActive: false });
    await assert.rejects(signInStaff("carl@example.test", "EmulatorTest123!"), { code: "staff/inactive" });
    assert.equal(auth.currentUser, null);
    await seed("staffAccounts/" + staffId, { ...savedStaff, branchId: "" });
    await assert.rejects(signInStaff("carl@example.test", "EmulatorTest123!"), { code: "staff/unassigned" });
    assert.equal(auth.currentUser, null);
    await seed("staffAccounts/" + staffId, savedStaff);
  });
  await check("profile lookup failure signs the new login out", async () => {
    const failedLookup = loadService({ firestore: { getDocFromServer: async () => { throw firebaseError("unavailable"); } } }, "staffAuthenticationService", "signInStaff");
    await assert.rejects(failedLookup("carl@example.test", "EmulatorTest123!"), { code: "unavailable" });
    assert.equal(auth.currentUser, null);
  });
  const signInAdmin = loadService({}, "adminAuthenticationService", "signInAdmin");
  await check("configured administrator can sign in and create staff", async () => {
    await signInAdmin("  ADMIN@example.test  ", "AdminTest123!");
    assert.equal(auth.currentUser.uid, adminId);
    const created = await create(input("admin-login-flow@example.test"));
    assert((await firestore.getDocFromServer(firestore.doc(db, "staffAccounts", created.staffId))).exists());
    assert.equal(auth.currentUser.uid, adminId);
    await authSdk.signOut(auth);
  });
  await check("staff credentials cannot enter through admin login", async () => {
    await assert.rejects(signInAdmin("carl@example.test", "EmulatorTest123!"), { code: "admin/not-configured" });
    assert.equal(auth.currentUser, null);
  });
  await check("inactive administrator is rejected and signed back out", async () => {
    await seedAdmin(false);
    await assert.rejects(signInAdmin("admin@example.test", "AdminTest123!"), { code: "admin/inactive" });
    assert.equal(auth.currentUser, null);
    await seedAdmin();
  });
  await check("admin profile lookup failure does not leave a signed-in session", async () => {
    const failedLookup = loadService({ firestore: { getDocFromServer: async () => { throw firebaseError("unavailable"); } } }, "adminAuthenticationService", "signInAdmin");
    await assert.rejects(failedLookup("admin@example.test", "AdminTest123!"), { code: "unavailable" });
    assert.equal(auth.currentUser, null);
  });
  console.log(`\n${passed} account creation and login checks passed using local emulators only.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await firestore.terminate(db);
  await apps.deleteApp(app);
});
