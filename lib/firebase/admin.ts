import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const globalForFirebaseAdmin = globalThis as unknown as {
  firebaseAdminApp: ReturnType<typeof initializeApp> | undefined
}

const app =
  globalForFirebaseAdmin.firebaseAdminApp ??
  (getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      }))

if (process.env.NODE_ENV !== 'production') globalForFirebaseAdmin.firebaseAdminApp = app

export const adminAuth = getAuth(app)
