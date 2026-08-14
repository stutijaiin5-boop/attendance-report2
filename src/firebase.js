import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
]

export function missingEnvVars() {
  return REQUIRED_ENV_VARS.filter((key) => !import.meta.env[key])
}

let app = null
let auth = null
let db = null

export async function initFirebase() {
  if (app) return true

  const missing = missingEnvVars()
  if (missing.length > 0) {
    throw new Error(`Missing: ${missing.join(', ')}`)
  }

  const env = import.meta.env
  app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  })
  auth = getAuth(app)
  db = getFirestore(app)
  return true
}

export function getAuthInstance() {
  if (!auth) throw new Error('Firebase not initialized')
  return auth
}

export function getDb() {
  if (!db) throw new Error('Firebase not initialized')
  return db
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}