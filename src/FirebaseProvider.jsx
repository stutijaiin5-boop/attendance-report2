import { useEffect, useState } from 'react'
import { initFirebase } from './firebase'

export default function FirebaseProvider({ children }) {
  const [state, setState] = useState({ ready: false, error: null })

  useEffect(() => {
    let active = true
    initFirebase()
      .then(() => active && setState({ ready: true, error: null }))
      .catch((err) => active && setState({ ready: false, error: err.message }))
    return () => {
      active = false
    }
  }, [])

  if (state.error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card w-full max-w-md p-6">
          <h1 className="mb-2 text-lg font-bold text-red-600">Setup required</h1>
          <p className="text-sm leading-relaxed text-slate-600">{state.error}</p>
          <p className="mt-3 text-xs text-slate-400">
            Follow the README to create a Firebase project and add your keys.
          </p>
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