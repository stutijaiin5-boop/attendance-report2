import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSubjects, useRecordsForSubjects } from '../hooks/useData'
import { computeSubjectStats, ringColor } from '../utils/attendanceMath'
import { addDays, formatLong, startOfWeek, toDateKey, weekdayLabel, todayMidnight } from '../utils/dates'
import { deleteSubject, markAttendance } from '../services/attendance'
import MonthCalendar from '../components/MonthCalendar'
import StatusControl from '../components/StatusControl'
import StatCard from '../components/StatCard'
import ProgressRing from '../components/ProgressRing'
import Spinner from '../components/Spinner'

export default function SubjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { subjects, loading } = useSubjects()
  const subject = subjects.find((s) => s.id === id)
  const { recordsBySubject } = useRecordsForSubjects(subjects.map((s) => s.id))
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  if (!subject) return <Navigate to="/" replace />

  const records = recordsBySubject[id] || []
  const stats = computeSubjectStats(records, subject.targetPercent)
  const today = todayMidnight()
  const weekStart = startOfWeek(today)
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const onMark = async (dateKey, status) => {
    setBusy(true)
    try {
      await markAttendance(id, dateKey, status)
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!window.confirm(`Delete "${subject.name}" and all its attendance records?`)) return
    setBusy(true)
    try {
      await deleteSubject(id)
      navigate('/')
    } catch (err) {
      console.error(err)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">← Dashboard</Link>
        <div className="flex gap-2">
          <Link to={`/subject/${id}/edit`} className="btn-outline px-3 py-1.5 text-xs">Edit</Link>
          <button type="button" onClick={onDelete} disabled={busy} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
            Delete
          </button>
        </div>
      </div>

      <header className="flex items-center gap-4">
        <ProgressRing percent={stats.percent} size={84} color={ringColor(stats.percent, subject.targetPercent)} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{subject.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Target {subject.targetPercent}% · {weekdayLabel(subject.scheduledDays[0])}–{weekdayLabel(subject.scheduledDays[subject.scheduledDays.length - 1])}
          </p>
          {stats.isLow && (
            <span className="mt-1.5 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
              Below target
            </span>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Attended" value={`${stats.present}/${stats.held}`} sub="present / held" />
        <StatCard label="Safe to bunk" value={stats.safeToBunk} sub="miss & stay ≥ target" tone={stats.safeToBunk > 0 ? 'good' : 'warn'} />
        <StatCard
          label="Need to attend"
          value={stats.needToAttend}
          sub="consecutive to recover"
          tone={stats.needToAttend > 0 ? 'warn' : 'default'}
        />
        <StatCard label="Cancelled" value={records.filter((r) => r.status === 'cancelled').length} sub="don't count in %" />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">This week</h2>
        <div className="grid grid-cols-7 gap-1">
          {week.map((day) => {
            const key = toDateKey(day)
            const scheduled = subject.scheduledDays.includes(day.getDay())
            const status = records.find((r) => r.date === key)?.status || null
            const isToday = key === toDateKey(today)
            const past = day <= today

            return (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400">
                  {weekdayLabel(day.getDay())}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    isToday ? 'bg-emerald-600 text-white' : past ? 'bg-slate-100 text-slate-600' : 'text-slate-300'
                  }`}
                >
                  {day.getDate()}
                </span>
                {scheduled && past ? (
                  <StatusControl compact status={status} onChange={(s) => onMark(key, s)} />
                ) : (
                  <span className="rounded-lg px-2 py-1 text-[10px] font-medium text-slate-300">
                    {scheduled ? 'upcoming' : 'off'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <MonthCalendar subject={subject} records={records} onChange={onMark} />

      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Recent marks</h2>
        {records.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            No classes marked yet. Tap a day above, or use the calendar to catch up on history.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {[...records]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 8)
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-600">{formatLong(r.date)}</span>
                  <span className={`font-semibold ${
                    r.status === 'present' ? 'text-emerald-600' : r.status === 'absent' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {r.status[0].toUpperCase() + r.status.slice(1)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  )
}