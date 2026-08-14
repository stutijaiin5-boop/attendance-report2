// Example serverless function showing how to do privileged, server-side
// Firebase work (e.g. scheduled notifications, admin reports) using the
// Firebase Admin SDK with a secret service account. Nothing here runs
// unless you set FIREBASE_SERVICE_ACCOUNT env var + install firebase-admin:
//
//   npm install firebase-admin
//
// Then enable the function from Netlify UI or crons: https://docs.netlify.com/functions/scheduled-functions/
// This file is intentionally inert unless firebase-admin is installed.
import { getFirestore } from 'firebase-admin/firestore'

let initialized = false

async function admin() {
  const { initializeApp, cert, getApps } = await import('firebase-admin/app')
  if (getApps().length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    })
  }
  initialized = true
  return getFirestore()
}

export const handler = async () => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          'Admin function is set up but inactive. Set FIREBASE_SERVICE_ACCOUNT to enable server-side Firebase access.',
      }),
    }
  }

  try {
    const db = admin()
    const users = await db.collection('users').limit(10).get()
    return {
      statusCode: 200,
      body: JSON.stringify({ userCount: users.size }),
    }
  } catch (error) {
    console.error('admin example error', error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}