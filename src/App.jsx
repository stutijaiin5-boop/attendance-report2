import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Spinner from './components/Spinner'
import AuthPage from './pages/AuthPage'
import Home from './pages/Home'
import Calendar from './pages/Calendar'

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner label="Signing you in…" />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<Protected />}>
        <Route path="/" element={<Home />} />
        <Route path="/card/:cardId" element={<Calendar />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}