import admin from 'firebase-admin';

let db, auth;
let firebaseInitialized = false;

try {
  if (!admin.apps.length) {
    // Kiểm tra xem có service account key không
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        ),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not found. Using fallback mode.');
    }
  } else {
    firebaseInitialized = true;
  }
  
  if (firebaseInitialized) {
    db = admin.firestore();
    auth = admin.auth();
  }
} catch (e) {
  console.error("❌ Firebase Admin initialization failed:", e.message);
  firebaseInitialized = false;
}

// Helper function để kiểm tra Firebase status
export const isFirebaseReady = () => firebaseInitialized;

export { db, auth };