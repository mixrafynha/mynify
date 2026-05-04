import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

export async function logAction(userId, action, metadata = {}) {
  await addDoc(collection(db, "logs"), {
    userId,
    action,
    metadata,
    timestamp: serverTimestamp()
  })
}