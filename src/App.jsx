import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Spinner from './components/Spinner'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import SubjectForm from './pages/SubjectForm'
import SubjectDetail from './pages/SubjectDetail'
import History from './pages/History'

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner label="Signing you in…" />
  if (!user) return <Navigate to="/login" replace />
  return <Layout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<Protected />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding" element={<SubjectForm />} />
        <Route path="/subject/new" element={<SubjectForm />} />
        <Route path="/subject/:id" element={<SubjectDetail />} />
        <Route path="/subject/:id/edit" element={<SubjectForm />} />
        <Route path="/history" element={<History />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}