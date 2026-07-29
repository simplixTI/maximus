import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

// Public config. Same values as public/firebase-messaging-sw.js — Firebase Web
// config is safe to embed in client code by design.
const firebaseConfig = {
  apiKey: "AIzaSyB2yJRmORcVhRMrFLSOQQ8EVKwgc8QxGIU",
  authDomain: "maximus-f0e7b.firebaseapp.com",
  projectId: "maximus-f0e7b",
  storageBucket: "maximus-f0e7b.firebasestorage.app",
  messagingSenderId: "499240641079",
  appId: "1:499240641079:web:04ec2b9dbee6bf2ddf55b2",
};

// VAPID public key from Firebase Console → Cloud Messaging → Web Push
// certificates. Public half of a keypair — safe to embed.
export const FIREBASE_VAPID_KEY =
  "BPjlTW9PBNIRWUC0njuyjVdEsTZpGW9an7vFlv97nYvbZbjijTqHaYc5Ze7NBP4YoiwgNsj-QdntJlTpAOHL8Mo";

let appSingleton: FirebaseApp | null = null;
let messagingSingleton: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (appSingleton) return appSingleton;
  appSingleton = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return appSingleton;
}

/**
 * Returns a Messaging instance, or null if the current browser doesn't
 * support Firebase Messaging (older iOS Safari outside PWA, some embedded
 * webviews, etc.).
 */
export async function getFirebaseMessagingIfSupported(): Promise<Messaging | null> {
  try {
    if (!(await isSupported())) return null;
  } catch {
    return null;
  }
  if (messagingSingleton) return messagingSingleton;
  messagingSingleton = getMessaging(getFirebaseApp());
  return messagingSingleton;
}

export { getToken, onMessage };
export type { MessagePayload };
