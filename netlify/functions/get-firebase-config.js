// Serves the Firebase web config from Netlify environment variables
// (FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, ...) so keys are not hardcoded
// or bundled into the client. The client fetches this at startup in production.
export const handler = async () => {
  const keys = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
  ]

  const config = {}
  for (const key of keys) {
    if (process.env[key]) {
      config[key.replace('FIREBASE_', '')] = process.env[key]
    }
  }

  if (!config.apiKey || !config.projectId || !config.appId) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error:
          'Firebase config missing. Set FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID and FIREBASE_APP_ID in Netlify environment variables.',
      }),
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ config }),
  }
}