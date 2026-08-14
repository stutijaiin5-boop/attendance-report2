import { useEffect, useState } from 'react'
import { initFirebase, missingEnvVars } from './firebase'

export default function FirebaseProvider({ children }) {
  const [state, setState] = useState({ ready: false, missing: null, error: null })

  useEffect(() => {
    let active = true
    initFirebase()
      .then(() => active && setState({ ready: true, missing: null, error: null }))
      .catch((err) => {
        if (!active) return
        setState({
          ready: false,
          missing: err.message?.startsWith('Missing:') ? err.message.replace('Missing: ', '') : null,
          error: err.message,
        })
      })
    return () => {
      active = false
    }
  }, [])

  if (state.missing) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card w-full max-w-md p-6">
          <h1 className="mb-2 text-lg font-bold text-red-600">Setup required</h1>
          <p className="mb-3 text-sm leading-relaxed text-slate-600">
            Firebase configuration is incomplete. Add these environment variables
            (a <code className="rounded bg-slate-100 px-1">.env</code> file for local dev, or Netlify
            site environment variables for production):
          </p>
          <ul className="space-y-1.5">
            {state.missing.split(', ').map((key) => (
              <li key={key} className="rounded-lg bg-red-50 px-3 py-2 font-mono text-xs font-semibold text-red-700">
                {key}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            Follow the README to create a Firebase project and fill in the values.
          </p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card w-full max-w-md p-6">
          <h1 className="mb-2 text-lg font-bold text-red-600">Setup required</h1>
          <p className="text-sm text-slate-600">{state.error}</p>
        </div>
      </div>
    )
  }

  if (!state.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    )
  }

  return children
}