import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

let app = null
let auth = null
let db = null

function configFromEnv(env) {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
}

export async function initFirebase() {
  if (app) return true

  let config
  if (import.meta.env.DEV) {
    config = configFromEnv(import.meta.env)
  } else {
    try {
      const res = await fetch('/.netlify/functions/get-firebase-config')
      if (res.ok) {
        const data = await res.json()
        config = data.config
      } else {
        const detail = await res.json().catch(() => null)
        console.warn(
          'Firebase config function unavailable:',
          detail?.error || res.status,
          'Falling back to build-time env vars.',
        )
      }
    } catch (err) {
      console.warn('Firebase config function failed, falling back to build-time env vars.', err)
    }
    if (!config?.apiKey || !config?.projectId) {
      config = configFromEnv(import.meta.env)
    }
  }

  if (!config?.apiKey || !config?.projectId) {
    throw new Error(
      'Firebase configuration is missing. Add VITE_FIREBASE_* keys to your local .env file (dev) or FIREBASE_* keys to Netlify environment variables (production). See README.md.',
    )
  }

  app = initializeApp(config)
  auth = getAuth(app)
  db = getFirestore(app)
  return true
}

export function getFirebaseApp() {
  return app
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