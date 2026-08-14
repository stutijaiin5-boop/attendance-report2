import { useMemo, useState } from 'react'
import {
  monthGrid,
  monthLabel,
  toDateKey,
  weekdayLabel,
  todayMidnight,
} from '../utils/dates'

const CELL = {
  present: 'bg-emerald-600 text-white',
  absent: 'bg-red-600 text-white',
  cancelled: 'bg-amber-500 text-white',
  empty: 'border border-slate-300 text-slate-400 hover:bg-slate-50',
  future: 'border border-dashed border-slate-300 text-slate-300',
  off: 'text-slate-300',
}

// Interactive month calendar for marking past scheduled classes.
// Clicking a past scheduled day cycles: unmarked -> present -> absent -> cancelled -> unmarked.
export default function MonthCalendar({ subject, records, onChange }) {
  const today = todayMidnight()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const canGoForward = cursor.getFullYear() < today.getFullYear() || cursor.getMonth() < today.getMonth()

  const days = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor])
  const recordMap = useMemo(
    () => Object.fromEntries(records.map((r) => [r.date, r.status])),
    [records],
  )

  const cycle = (status) =>
    ({ present: 'absent', absent: 'cancelled', cancelled: null, null: 'present' })[status]

  const scheduledOn = (day) => subject.scheduledDays?.includes(day.getDay())

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Mark attendance</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <span className="w-32 text-center text-xs font-medium text-slate-600">
            {monthLabel(cursor.getFullYear(), cursor.getMonth())}
          </span>
          <button
            type="button"
            disabled={!canGoForward}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50 disabled:opacity-30"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i}>{weekdayLabel(i)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const inMonth = day.getMonth() === cursor.getMonth()
          const isToday = toDateKey(day) === toDateKey(today)
          const scheduled = scheduledOn(day)
          const future = day > today
          const status = recordMap[toDateKey(day)] || null

          let cls = 'h-10 rounded-lg text-xs font-semibold'
          if (!inMonth || !scheduled) return <div key={i} className={cls} />
          if (future) {
            return (
              <div key={i} className={`${cls} ${CELL.future}`} title="Scheduled class">
                {day.getDate()}
              </div>
            )
          }
          if (!status) cls += ` ${CELL.empty}`
          else cls += ` ${CELL[status]}`
          if (isToday) cls += ' ring-2 ring-emerald-400 ring-offset-1'

          return (
            <button
              key={i}
              type="button"
              className={cls}
              title={`${weekdayLabel(day.getDay())} ${monthLabel(day.getFullYear(), day.getMonth())} ${day.getDate()}`}
              onClick={() => onChange(toDateKey(day), cycle(status))}
            >
              {status ? status[0].toUpperCase() : day.getDate()}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" />Present</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-600" />Absent</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />Cancelled</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-slate-300" />Unmarked · tap to cycle</span>
      </div>
    </div>
  )
}