import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  initializeAuth,
  inMemoryPersistence,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { doc, getDocFromServer, runTransaction, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../firebase/firebase";

export interface CreateStaffLoginInput {
  fullName: string;
  email: string;
  password: string;
  branchId: string;
}

export class StaffProvisioningError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "StaffProvisioningError";
  }
}

let provisioning = false;
let appSequence = 0;

const errorCode = (error: unknown): string =>
  typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

const requireAdmin = (profile: Record<string, unknown> | undefined): void => {
  if (profile?.role !== "admin" || profile.isActive !== true) {
    throw new StaffProvisioningError(
      "staff/admin-required",
      "Sign in with an active administrator account to create staff."
    );
  }
};

const requireBranch = (profile: Record<string, unknown> | undefined): void => {
  if (!profile || profile.isActive !== true) {
    throw new StaffProvisioningError(
      "staff/branch-unavailable",
      "This branch is no longer active. Select an active branch and try again."
    );
  }
};

const requireSameAdmin = (adminId: string): void => {
  if (auth.currentUser?.uid !== adminId) {
    throw new StaffProvisioningError(
      "staff/session-changed",
      "Your sign-in session changed. Sign in as the administrator and try again."
    );
  }
};

// Only these errors establish that our profile transaction did not commit.
const definitelyRejected = new Set([
  "permission-denied",
  "unauthenticated",
  "invalid-argument",
  "failed-precondition",
  "staff/admin-required",
  "staff/branch-unavailable",
  "staff/session-changed",
]);

/** Creates a staff login without signing the administrator out of the primary app. */
export async function createStaffLoginAccount(
  input: CreateStaffLoginInput
): Promise<{ staffId: string }> {
  if (provisioning) {
    throw new StaffProvisioningError("staff/in-progress", "A staff account is already being created. Please wait.");
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const branchId = input.branchId.trim();
  if (!fullName || fullName.length > 120) {
    throw new StaffProvisioningError("staff/invalid-name", "Enter the staff member's full name (up to 120 characters).");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new StaffProvisioningError("staff/invalid-email", "Enter a valid email address.");
  }
  if (input.password.length < 6) {
    throw new StaffProvisioningError("staff/invalid-password", "Use a temporary password with at least 6 characters.");
  }
  if (!branchId || branchId.includes("/")) {
    throw new StaffProvisioningError("staff/invalid-branch", "Select a branch for this staff member.");
  }

  provisioning = true;
  let secondaryApp: FirebaseApp | undefined;
  let secondaryAuth: Auth | undefined;
  let staffUser: User | undefined;
  try {
    await auth.authStateReady();
    const administrator = auth.currentUser;
    if (!administrator) requireAdmin(undefined);
    const adminId = administrator!.uid;
    const adminRef = doc(db, "staffAccounts", adminId);
    const branchRef = doc(db, "branches", branchId);

    // Verify permissions from the server before creating anything in Authentication.
    const [adminSnapshot, branchSnapshot] = await Promise.all([
      getDocFromServer(adminRef),
      getDocFromServer(branchRef),
    ]);
    requireAdmin(adminSnapshot.data());
    requireBranch(branchSnapshot.data());
    requireSameAdmin(adminId);

    secondaryApp = initializeApp(
      auth.app.options,
      `staff-provisioning-${Date.now()}-${++appSequence}`
    );
    secondaryAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });
    secondaryAuth.tenantId = auth.tenantId;
    // A locally emulated primary app must never create staff in production Auth.
    if (auth.emulatorConfig) {
      const { protocol, host, port } = auth.emulatorConfig;
      const emulatorUrl = `${protocol}://${host}${port === null ? "" : `:${port}`}`;
      connectAuthEmulator(secondaryAuth, emulatorUrl, { disableWarnings: true });
    }

    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, input.password);
      staffUser = credential.user;
    } catch (error) {
      if (errorCode(error) === "auth/network-request-failed") {
        throw new StaffProvisioningError(
          "staff/auth-result-unknown",
          "The connection was interrupted while creating the login. Check Firebase Authentication for this email before trying again."
        );
      }
      throw error;
    }

    const staffId = staffUser.uid;
    const staffRef = doc(db, "staffAccounts", staffId);
    const details = {
      staffId,
      fullName,
      email: staffUser.email || email,
      role: "staff" as const,
      branchId,
      createdBy: adminId,
      createdAt: serverTimestamp(),
      isActive: true,
    };

    try {
      requireSameAdmin(adminId);
      // Uses the primary app's administrator credentials. Rechecking within the
      // transaction also prevents assigning a branch disabled during creation.
      await runTransaction(db, async (transaction) => {
        requireSameAdmin(adminId);
        const [currentAdmin, currentBranch, existingStaff] = await Promise.all([
          transaction.get(adminRef),
          transaction.get(branchRef),
          transaction.get(staffRef),
        ]);
        requireAdmin(currentAdmin.data());
        requireBranch(currentBranch.data());
        if (existingStaff.exists()) {
          throw new StaffProvisioningError("staff/profile-conflict", "A staff profile already exists for this login.");
        }
        transaction.set(staffRef, details);
      });
    } catch (error) {
      if (definitelyRejected.has(errorCode(error))) {
        // A rejected write cannot leave a working login with no staff profile.
        try {
          await deleteUser(staffUser);
        } catch {
          throw new StaffProvisioningError(
            "staff/cleanup-required",
            `The staff profile could not be saved, and the new login could not be removed. Check Authentication UID ${staffId} in Firebase before retrying.`
          );
        }
        throw new StaffProvisioningError(
          "staff/profile-rejected",
          "The staff profile could not be saved. The new login was removed. Check your administrator access and the selected branch, then try again."
        );
      }

      // A lost acknowledgement is not proof of a failed write. Never delete a
      // login whose matching profile might already have committed.
      try {
        requireSameAdmin(adminId);
        const saved = await getDocFromServer(staffRef);
        const data = saved.data();
        if (saved.exists() && data?.staffId === staffId && data.email === details.email &&
            data.fullName === fullName && data.branchId === branchId &&
            data.createdBy === adminId && data.role === "staff" && data.isActive === true) {
          return { staffId };
        }
      } catch {
        // Report the unresolved result below, preserving the Authentication user.
      }
      throw new StaffProvisioningError(
        "staff/profile-result-unknown",
        `The login was created, but the staff profile could not be confirmed. Check staffAccounts/${staffId} and Authentication in Firebase before retrying.`
      );
    }
    return { staffId };
  } finally {
    // Only the isolated, in-memory session is cleaned up. Never sign out auth.
    try {
      if (secondaryAuth) await signOut(secondaryAuth);
    } catch {
      // Deleting the isolated app below also discards its in-memory session.
    }
    try {
      if (secondaryApp) await deleteApp(secondaryApp);
    } catch {
      // A cleanup failure must not turn a successfully saved account into an
      // apparent failure and encourage the administrator to create it again.
    } finally {
      provisioning = false;
    }
  }
}
