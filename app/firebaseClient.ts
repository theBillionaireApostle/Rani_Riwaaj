// app/firebaseClient.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Firebase configuration, using environment variables
const inferProjectId = (
  authDomain?: string,
  storageBucket?: string
): string | undefined => {
  if (authDomain) {
    const match = authDomain.match(/^(.*)\.(firebaseapp\.com|web\.app)$/);
    if (match) return match[1];
  }

  if (storageBucket) {
    const match = storageBucket.match(/^(.*)\.appspot\.com$/);
    if (match) return match[1];
  }

  return undefined;
};

const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  inferProjectId(authDomain, storageBucket);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Only initialize analytics when the code runs in the browser
const analytics =
  typeof window !== "undefined" &&
  firebaseConfig.projectId &&
  firebaseConfig.measurementId
    ? getAnalytics(app)
    : null;

// Initialize Firebase Authentication and setup Google Auth Provider
let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  if (typeof window !== "undefined") {
    console.warn("Firebase Auth disabled due to invalid config:", error);
  }
}

export { app, analytics, auth, googleProvider };
