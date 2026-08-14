import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSubjects } from '../hooks/useData'
import { createSubject, updateSubject } from '../services/attendance'
import { WEEKDAYS } from '../utils/dates'
import Spinner from '../components/Spinner'

const PRESETS = [70, 75, 80, 85]

export default function SubjectForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { subjects, loading } = useSubjects()
  const editing = subjects.find((s) => s.id === id)

  const [step, setStep] = useState(1)
  const [name, setName] = useState(editing?.name || '')
  const [target, setTarget] = useState(editing?.targetPercent || 75)
  const [days, setDays] = useState(editing?.scheduledDays || [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  if (id && !editing) return <Navigate to="/" replace />

  const isOnboarding = !id && subjects.length === 0
  const toggleDay = (day) =>
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day].sort()))

  const next = () => {
    if (!name.trim()) return setError('Give the subject a name.')
    if (days.length === 0) return setError('Pick at least one day it occurs on.')
    setStep(2)
  }

  const save = async () => {
    setError('')
    setBusy(true)
    try {
      if (id) await updateSubject(id, { name, targetPercent: target, scheduledDays: days })
      else await createSubject({ name, targetPercent: target, scheduledDays: days })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Could not save subject.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className={`h-1.5 w-6 rounded-full ${step === 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          <span className={`h-1.5 w-6 rounded-full ${step === 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        </div>
      </div>

      <header>
        <h1 className="text-2xl font-bold text-slate-800">
          {isOnboarding ? 'Set up your first subject' : id ? 'Edit subject' : 'Add subject'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isOnboarding
            ? 'You’ll be tracking classes in no time.'
            : 'Attend classes, mark them, and the app handles the rest.'}
        </p>
      </header>

      {step === 1 ? (
        <div className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="name">Subject name</label>
            <input
              id="name"
              className="input"
              placeholder="e.g. Data Structures"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="target">
              Target attendance · <b className="text-emerald-600">{target}%</b>
            </label>
            <input
              id="target"
              type="range"
              min={50}
              max={100}
              step={1}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>50%</span><span>100%</span>
            </div>
            <div className="mt-2 flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTarget(p)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    target === p ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Class occurs on</span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    days.includes(i)
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <button type="button" onClick={next} className="btn-primary w-full">
            Continue
          </button>
        </div>
      ) : (
        <div className="card space-y-4 p-5">
          <div className="rounded-xl bg-emerald-50 p-4 text-sm">
            <p className="font-semibold text-emerald-800">{name.trim()}</p>
            <p className="mt-1 text-xs text-emerald-700">
              Target {target}% · {days.length > 0 ? `${days.length} day${days.length > 1 ? 's' : ''} a week` : 'no days'} ·{' '}
              {days.map((d) => WEEKDAYS[d]).join(', ') || '—'}
            </p>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>✅ Mark Present / Absent / Cancelled each class</li>
            <li>📊 Live %, safe-to-bunk and catch-up counters</li>
            <li>🔥 Full-attendance streaks</li>
          </ul>
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
              Back
            </button>
            <button type="button" onClick={save} disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : id ? 'Save changes' : isOnboarding ? 'Create & start tracking' : 'Add subject'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}