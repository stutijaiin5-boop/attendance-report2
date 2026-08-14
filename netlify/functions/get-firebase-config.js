// Serves the Firebase web config from Netlify environment variables so keys
// are not hardcoded or bundled into the client. Accepts both FIREBASE_* and
// VITE_FIREBASE_* names. The client fetches this at startup in production.
export const handler = async () => {
  const prefixes = ['FIREBASE_', 'VITE_FIREBASE_']
  const fields = [
    'API_KEY',
    'AUTH_DOMAIN',
    'PROJECT_ID',
    'STORAGE_BUCKET',
    'MESSAGING_SENDER_ID',
    'APP_ID',
  ]

  const config = {}
  for (const prefix of prefixes) {
    for (const field of fields) {
      const key = prefix + field
      if (!config[field] && process.env[key]) {
        config[field] = process.env[key]
      }
    }
  }

  const missing = fields.filter((f) => !config[f])
  if (missing.length > 0) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Function env has no value for: ${missing
          .map((f) => 'FIREBASE_' + f)
          .join(', ')}. In Netlify > Site configuration > Environment variables, open each var and set Scope to include FUNCTIONS (or "All scopes"), then redeploy.`,
        missing,
      }),
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({
      config: {
        apiKey: config.API_KEY,
        authDomain: config.AUTH_DOMAIN,
        projectId: config.PROJECT_ID,
        storageBucket: config.STORAGE_BUCKET,
        messagingSenderId: config.MESSAGING_SENDER_ID,
        appId: config.APP_ID,
      },
    }),
  }
}