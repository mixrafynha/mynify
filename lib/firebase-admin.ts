import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let firestoreInstance: ReturnType<typeof getFirestore> | null = null;

export function getFirestoreAdmin() {
  if (firestoreInstance) return firestoreInstance;

  const firebaseBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!firebaseBase64) {
    return null;
  }

  const serviceAccount = JSON.parse(
    Buffer.from(firebaseBase64, "base64").toString("utf-8"),
  );

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  firestoreInstance = getFirestore();
  return firestoreInstance;
}
