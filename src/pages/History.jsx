import { useMemo, useState } from 'react'
import { useSubjects, useRecordsForSubjects } from '../hooks/useData'
import {
  addDays,
  monthGrid,
  monthLabel,
  startOfWeek,
  toDateKey,
  weekdayLabel,
  todayMidnight,
} from '../utils/dates'
import { computeSubjectStats } from '../utils/attendanceMath'
import Spinner from '../components/Spinner'

const CELL = {
  present: 'bg-emerald-600 text-white',
  absent: 'bg-red-600 text-white',
  cancelled: 'bg-amber-500 text-white',
  none: 'bg-slate-100 text-slate-400',
}

export default function History() {
  const { subjects, loading } = useSubjects()
  const { recordsBySubject } = useRecordsForSubjects(subjects.map((s) => s.id))
  const today = todayMidnight()

  const [view, setView] = useState('week')
  const [weekCursor, setWeekCursor] = useState(today)
  const [monthCursor, setMonthCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )

  const weekStart = startOfWeek(weekCursor)
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const monthDays = useMemo(
    () => monthGrid(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor],
  )

  if (loading) return <Spinner label="Loading history…" />

  const statusOn = (subjectId, dateKey) =>
    (recordsBySubject[subjectId] || []).find((r) => r.date === dateKey)?.status || null

  const weekRecords = (subjectId) => {
    const keys = new Set(weekDays.map((d) => toDateKey(d)))
    return (recordsBySubject[subjectId] || []).filter((r) => keys.has(r.date))
  }

  const monthStats = (subjectId) =>
    computeSubjectStats(monthRecords(subjectId), subjects.find((s) => s.id === subjectId)?.targetPercent || 75)

  const monthRecords = (subjectId) => {
    const keys = new Set(monthDays.map((d) => toDateKey(d)))
    return (recordsBySubject[subjectId] || []).filter((r) => keys.has(r.date))
  }

  const canGoForward =
    monthCursor.getFullYear() < today.getFullYear() || monthCursor.getMonth() < today.getMonth()

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">History</h1>
          <p className="text-sm text-slate-500">Weekly and monthly attendance at a glance.</p>
        </div>
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {['week', 'month'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 capitalize transition ${
                view === v ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      {subjects.length === 0 && (
        <p className="card p-8 text-center text-sm text-slate-400">
          Nothing to show yet — add a subject from the dashboard first.
        </p>
      )}

      {view === 'week' && subjects.length > 0 && (
        <section className="card overflow-x-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50"
              onClick={() => setWeekCursor(addDays(weekStart, -7))}
            >
              ‹ Prev
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <button
              type="button"
              disabled={weekStart >= startOfWeek(today)}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50 disabled:opacity-30"
              onClick={() => setWeekCursor(addDays(weekStart, 7))}
            >
              Next ›
            </button>
          </div>

          <table className="w-full text-center text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="pb-2 text-left text-[11px] font-semibold uppercase">Subject</th>
                {weekDays.map((d) => (
                  <th key={d} className={`pb-2 ${toDateKey(d) === toDateKey(today) ? 'text-emerald-600' : ''}`}>
                    {weekdayLabel(d.getDay())}
                    <div className="font-normal">{d.getDate()}</div>
                  </th>
                ))}
                <th className="pb-2 text-[11px] font-semibold uppercase">Week %</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => {
                const weekStats = computeSubjectStats(weekRecords(s.id), s.targetPercent)
                return (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-2 pr-2 text-left font-medium text-slate-700">{s.name}</td>
                    {weekDays.map((d) => {
                      const status = statusOn(s.id, toDateKey(d))
                      return (
                        <td key={d} className="py-2">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                              status ? CELL[status] : 'bg-slate-50 text-slate-200'
                            }`}
                          >
                            {status ? status[0].toUpperCase() : '·'}
                          </span>
                        </td>
                      )
                    })}
                    <td className="py-2 pl-2 font-semibold text-slate-700">
                      {weekStats.held === 0 ? '—' : `${Math.round(weekStats.percent)}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" />P present</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-600" />A absent</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />C cancelled</span>
          </div>
        </section>
      )}

      {view === 'month' && subjects.length > 0 && (
        <section className="card overflow-x-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50"
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {monthLabel(monthCursor.getFullYear(), monthCursor.getMonth())}
            </span>
            <button
              type="button"
              disabled={!canGoForward}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50 disabled:opacity-30"
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
            {Array.from({ length: 7 }, (_, i) => <div key={i}>{weekdayLabel(i)}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d, i) => {
              const inMonth = d.getMonth() === monthCursor.getMonth()
              const future = d > today
              const marks = subjects
                .filter((s) => s.scheduledDays.includes(d.getDay()))
                .map((s) => ({ s, status: statusOn(s.id, toDateKey(d)) }))
              const isToday = toDateKey(d) === toDateKey(today)

              return (
                <div
                  key={i}
                  className={`min-h-[64px] rounded-lg p-1 ${inMonth ? 'bg-slate-50' : 'bg-transparent'} ${
                    isToday ? 'ring-2 ring-emerald-400 ring-offset-1' : ''
                  }`}
                >
                  <div className="text-[10px] font-semibold text-slate-500">{inMonth ? d.getDate() : ''}</div>
                  <div className="mt-0.5 space-y-0.5">
                    {inMonth &&
                      marks.map(({ s, status }) => (
                        <div
                          key={s.id}
                          title={`${s.name}${status ? `: ${status}` : ' · unmarked'}`}
                          className={`truncate rounded px-1 py-0.5 text-[9px] font-bold ${
                            future
                              ? 'border border-dashed border-slate-300 text-slate-300'
                              : status
                                ? CELL[status]
                                : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {s.name.length > 14 ? `${s.name.slice(0, 12)}…` : s.name}
                          {status && !future ? ` · ${status[0].toUpperCase()}` : ''}
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Month summary
            </h3>
            <ul className="divide-y divide-slate-100 text-sm">
              {subjects.map((s) => {
                const st = monthStats(s.id)
                return (
                  <li key={s.id} className="flex items-center justify-between py-2">
                    <span className="font-medium text-slate-700">{s.name}</span>
                    <span className="text-xs text-slate-500">
                      {st.held === 0 ? (
                        'no classes marked'
                      ) : (
                        <>
                          <b className={st.percent >= s.targetPercent ? 'text-emerald-600' : 'text-red-600'}>
                            {Math.round(st.percent)}%
                          </b>{' '}
                          · {st.present}/{st.held} held · target {s.targetPercent}%
                        </>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}