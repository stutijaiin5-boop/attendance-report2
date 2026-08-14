import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLink = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'
  }`

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">
              ✓
            </span>
            Attendance Report
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLink}>
              Dashboard
            </NavLink>
            <NavLink to="/history" className={navLink}>
              History
            </NavLink>
            <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-2">
              <span className="hidden h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 sm:flex">
                {(user?.email || '?')[0].toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => logout().then(() => navigate('/login'))}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}