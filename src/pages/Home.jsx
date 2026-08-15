import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCards, useAllAttendance } from '../hooks/useData'
import { summarizeRecords, badgeColor } from '../utils/attendanceMath'
import { createCard } from '../services/attendance'
import ProgressRing from '../components/ProgressRing'
import { PromptModal } from '../components/Modals'
import { MenuIcon, MoreIcon, PlusIcon, SearchIcon } from '../components/icons'
import Spinner from '../components/Spinner'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { cards, loading, error: readError } = useCards()
  const { recordsByCard } = useAllAttendance(cards.map((c) => c.id))

  const [query, setQuery] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [overflow, setOverflow] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner label="Loading your cards…" />

  const filtered = cards.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))

  const addCard = async (name) => {
    setBusy(true)
    setError(null)
    try {
      await createCard(name)
      setAdding(false)
    } catch (err) {
      console.error(err)
      setError(
        err?.code === 'permission-denied'
          ? 'Firestore is rejecting writes — check your security rules (see README).'
          : `Could not create card: ${err?.message || err}`,
      )
    } finally {
      setBusy(false)
    }
  }

  const signOut = () => logout().then(() => navigate('/login'))

  const Menu = (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setOverflow(false)} />
      <div className="absolute right-2 top-14 z-40 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
        <button type="button" onClick={signOut} className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button type="button" onClick={() => setDrawer(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">Self Attendance</h1>
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
              aria-label="Add card"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
            <button type="button" onClick={() => setOverflow((o) => !o)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="More">
              <MoreIcon className="h-5 w-5" />
            </button>
            {overflow && Menu}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {(error || readError) && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {error || (readError.code === 'permission-denied'
                ? 'Firestore is rejecting reads — check your security rules (see README).'
                : `Could not reach Firestore: ${readError.code || readError.message}`)}
            </p>
            <button type="button" onClick={() => setError(null)} className="text-xs font-bold text-red-500 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="relative mb-4">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Type here to search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">
              {cards.length === 0 ? 'No cards yet — tap + to create one.' : 'No match for your search.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((card) => {
              const summary = summarizeRecords(recordsByCard[card.id] || [])
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/card/${card.id}`)}
                    className="card flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <span className="text-base font-semibold text-slate-800">{card.name}</span>
                    <ProgressRing percent={summary.percent} size={52} stroke={5} color={badgeColor(summary.percent)} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      {/* Hamburger drawer */}
      {drawer && (
        <div className="fixed inset-0 z-30 flex">
          <div className="h-full w-64 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                ✓
              </span>
              <div>
                <div className="text-sm font-bold text-slate-800">Self Attendance</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
              </div>
            </div>
            <nav className="px-3 py-3">
              <button type="button" onClick={signOut} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                Sign out
              </button>
            </nav>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setDrawer(false)} />
        </div>
      )}

      {adding && (
        <PromptModal
          title="New card"
          label="Name"
          submitText="Create"
          initial=""
          onCancel={() => setAdding(false)}
          onSubmit={addCard}
        />
      )}
    </div>
  )
}