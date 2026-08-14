import { Link, Navigate } from 'react-router-dom'
import { useSubjects, useRecordsForSubjects } from '../hooks/useData'
import { computeOverall, computeStreak, computeSubjectStats, ringColor } from '../utils/attendanceMath'
import ProgressRing from '../components/ProgressRing'
import SubjectCard from '../components/SubjectCard'
import StatCard from '../components/StatCard'
import Spinner from '../components/Spinner'

export default function Dashboard() {
  const { subjects, loading } = useSubjects()
  const { recordsBySubject } = useRecordsForSubjects(subjects.map((s) => s.id))

  if (loading) return <Spinner label="Loading your subjects…" />
  if (subjects.length === 0) return <Navigate to="/onboarding" replace />

  const statsBySubject = Object.fromEntries(
    subjects.map((s) => [s.id, computeSubjectStats(recordsBySubject[s.id] || [], s.targetPercent)]),
  )
  const overall = computeOverall(subjects, recordsBySubject)
  const streak = computeStreak(subjects, recordsBySubject)
  const lowSubjects = subjects.filter((s) => statsBySubject[s.id].isLow)

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/subject/new" className="btn-primary">
          + Add subject
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-4 p-4">
          <ProgressRing percent={overall.percent} size={72} color={ringColor(overall.percent, 75)} />
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Overall</div>
            <div className="text-sm font-semibold text-slate-700">
              {overall.present}/{overall.held} held
            </div>
            <div className="text-xs text-slate-500">{subjects.length} subject{subjects.length > 1 ? 's' : ''}</div>
          </div>
        </div>
        <StatCard
          label="Streak"
          value={streak > 0 ? `🔥 ${streak} day${streak > 1 ? 's' : ''}` : 'Start marking!'}
          sub={streak > 0 ? 'consecutive full-attendance days' : 'no active streak yet'}
          tone={streak > 0 ? 'good' : 'default'}
        />
      </section>

      {lowSubjects.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-bold text-red-700">⚠ Low attendance alerts</h2>
          <ul className="mt-2 space-y-1">
            {lowSubjects.map((s) => {
              const st = statsBySubject[s.id]
              return (
                <li key={s.id} className="text-sm text-red-600">
                  <Link to={`/subject/${s.id}`} className="font-semibold underline-offset-2 hover:underline">
                    {s.name}
                  </Link>{' '}
                  at {Math.round(st.percent)}% — target {s.targetPercent}% · attend{' '}
                  <b>{st.needToAttend}</b> straight
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Subjects</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {subjects.map((s) => (
            <SubjectCard key={s.id} subject={s} stats={statsBySubject[s.id]} />
          ))}
          <Link
            to="/subject/new"
            className="flex min-h-[104px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-400 transition hover:border-emerald-400 hover:text-emerald-600"
          >
            + Add subject
          </Link>
        </div>
      </section>
    </div>
  )
}