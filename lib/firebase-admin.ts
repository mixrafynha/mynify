import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!firebaseBase64) {
  throw new Error("Missing Firebase environment variables");
}

const serviceAccount = JSON.parse(
  Buffer.from(firebaseBase64, "base64").toString("utf-8")
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const firestore = getFirestore();
