import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getAuthInstance, getGoogleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuthInstance(), (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signup = (email, password) =>
    createUserWithEmailAndPassword(getAuthInstance(), email, password)

  const login = (email, password) =>
    signInWithEmailAndPassword(getAuthInstance(), email, password)

  const loginWithGoogle = () =>
    signInWithPopup(getAuthInstance(), getGoogleProvider())

  const logout = () => signOut(getAuthInstance())

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}