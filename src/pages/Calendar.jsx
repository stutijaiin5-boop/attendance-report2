import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCards, useAttendance } from '../hooks/useData'
import { clearAttendance, deleteCard, renameCard, setAttendance } from '../services/attendance'
import {
  addDays, formatLong, monthGrid, monthLabel, toDateKey, todayMidnight, WEEKDAYS,
} from '../utils/dates'
import { summarizeRecords, STATUS_LABELS } from '../utils/attendanceMath'
import ActionMenu from '../components/ActionMenu'
import SummaryPanel from '../components/SummaryPanel'
import { InfoModal, PromptModal } from '../components/Modals'
import {
  BackIcon, ChevronLeft, ChevronRight, MoreIcon, PencilIcon, PlusIcon,
} from '../components/icons'
import Spinner from '../components/Spinner'

const CELL_STYLES = {
  present: 'bg-emerald-500 text-white',
  absent: 'bg-red-500 text-white',
  half_day: 'bg-orange-400 text-white',
  holiday: 'bg-amber-500 text-white',
  overtime: 'bg-emerald-100 text-emerald-800',
}

const LABELS = {
  holiday: ['Holiday', 'text-red-500'],
  weekly_off: ['Week off', 'text-slate-400'],
  leave: ['Leave', 'text-amber-600'],
}

// Tap cycles Present -> Absent -> Clear -> Present...
// Long-press (or right-click) opens the full status menu.
function DateCell({ day, inMonth, isToday, record, onCycle, onLongPress }) {
  const { status, note } = record || {}
  const colored = CELL_STYLES[status]
  const label = LABELS[status]
  const key = toDateKey(day)
  const press = useRef(null)

  const start = () => {
    press.current = {
      timer: setTimeout(() => {
        press.current = { fired: true, timer: null }
        onLongPress(key)
      }, 450),
      fired: false,
    }
  }
  const finish = () => {
    const p = press.current
    if (!p) return
    press.current = null
    if (p.timer) {
      clearTimeout(p.timer)
      onCycle(key)
    }
  }
  const cancel = () => {
    if (press.current?.timer) clearTimeout(press.current.timer)
    press.current = null
  }

  return (
    <button
      type="button"
      onTouchStart={start}
      onTouchEnd={finish}
      onTouchMove={cancel}
      onMouseDown={start}
      onMouseUp={finish}
      onMouseLeave={cancel}
      onContextMenu={(e) => {
        e.preventDefault()
        cancel()
        onLongPress(key)
      }}
      className={`relative flex h-14 flex-col items-center justify-start rounded-lg pt-1 transition select-none ${
        inMonth ? (colored || 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100') : 'invisible'
      } ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
    >
      <span className={`text-sm font-semibold ${colored ? '' : 'text-slate-700'}`}>{day.getDate()}</span>
      {label && <span className={`text-[8px] leading-tight font-semibold ${colored ? 'text-white' : label[1]}`}>{label[0]}</span>}
      {status === 'overtime' && <span className="mt-0.5 text-[8px] font-black">OT</span>}
      {!status && note && <span className="absolute right-1 top-0.5 text-[10px]">✎</span>}
      {status && !label && (
        <span className={`mt-0.5 text-[8px] font-black ${(colored || '').includes('text-white') ? 'opacity-80' : ''}`}>
          {status[0].toUpperCase()}
        </span>
      )}
    </button>
  )
}

export default function Calendar() {
  const { cardId } = useParams()
  const navigate = useNavigate()
  const { cards, loading: cardsLoading } = useCards()
  const card = cards.find((c) => c.id === cardId)
  const { records, error: readError } = useAttendance(cardId)

  const today = todayMidnight()
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [menuDate, setMenuDate] = useState(null)
  const [overflow, setOverflow] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [prompt, setPrompt] = useState(null)
  const [detail, setDetail] = useState(false)
  const [tip, setTip] = useState(true)
  const [error, setError] = useState(null)
  const [flash, setFlash] = useState(null)
  const flashTimer = useRef(null)

  const touchX = useRef(null)
  const py = cursor.getFullYear()
  const pm = cursor.getMonth()

  const monthDays = useMemo(() => monthGrid(py, pm), [py, pm])
  const monthKey = monthLabel(py, pm)

  const monthRecords = useMemo(() => {
    const prefix = `${py}-${String(pm + 1).padStart(2, '0')}-`
    return (records || []).filter((r) => r.date.startsWith(prefix))
  }, [records, py, pm])
  const recordMap = useMemo(() => Object.fromEntries((records || []).map((r) => [r.date, r])), [records])
  const summary = summarizeRecords(monthRecords)

  if (cardsLoading) return <Spinner label="Loading…" />
  if (!card) return <Spinner label="Card not found…" />

  const todayKey = toDateKey(today)
  const inCurrentMonth = (d) => d.getMonth() === pm && d.getFullYear() === py

  const prevMonth = () => setCursor(new Date(py, pm - 1, 1))
  const nextMonth = () => setCursor(new Date(py, pm + 1, 1))

  // Wraps a Firestore op; surfaces failures on-screen instead of silently losing data.
  const run = async (fn) => {
    try {
      setError(null)
      await fn()
      if (flashTimer.current) clearTimeout(flashTimer.current)
      setFlash('Saved ✓')
      flashTimer.current = setTimeout(() => setFlash(null), 1500)
      return true
    } catch (err) {
      console.error(err)
      setError(
        err?.code === 'permission-denied'
          ? 'Firestore is rejecting writes — check your security rules (see README).'
          : err?.code === 'unavailable'
            ? 'No network connection — your marks are stored on this device and will sync when you\'re back online.'
            : `Could not save: ${err?.message || err}`,
      )
      return false
    }
  }

  const mark = async (status, extras) => {
    if (!menuDate) return
    if (status === 'overtime') {
      setPrompt({ type: 'ot' })
      return
    }
    if (status === 'note') {
      setPrompt({ type: 'note' })
      return
    }
    if (await run(() => setAttendance(cardId, menuDate, { status, ...extras }))) {
      setMenuDate(null)
    }
  }

  const onOvertime = async (hours) => {
    if (await run(() => setAttendance(cardId, menuDate, { status: 'overtime', otHours: Number(hours) }))) {
      setPrompt(null)
      setMenuDate(null)
    }
  }

  const onNote = async (text) => {
    if (await run(() => setAttendance(cardId, menuDate, { note: text }))) {
      setPrompt(null)
      setMenuDate(null)
    }
  }

  const onClear = async () => {
    if (await run(() => clearAttendance(cardId, menuDate))) {
      setMenuDate(null)
    }
  }

  // Quick-tap cycle: no status -> Present -> Absent -> no status -> ...
  const handleTap = async (dateKey) => {
    const current = recordMap[dateKey]?.status ?? null
    const next = current === 'present' ? 'absent' : current === 'absent' ? null : 'present'
    if (next === null) {
      await run(() => clearAttendance(cardId, dateKey))
    } else {
      await run(() => setAttendance(cardId, dateKey, { status: next }))
    }
  }

  const saveTitle = async () => {
    if (titleDraft.trim() && titleDraft.trim() !== card.name) {
      await run(() => renameCard(cardId, titleDraft.trim()))
    }
    setEditingTitle(false)
  }

  const onDeleteCard = async () => {
    setOverflow(false)
    if (!window.confirm(`Delete "${card.name}" and all its attendance records?`)) return
    if (await run(() => deleteCard(cardId))) {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <button type="button" onClick={() => navigate('/')} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Back">
            <BackIcon className="h-6 w-6" />
          </button>

          {editingTitle ? (
            <input
              className="input max-w-[200px] text-center font-bold"
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            />
          ) : (
            <button
              type="button"
              onClick={() => { setTitleDraft(card.name); setEditingTitle(true) }}
              className="flex max-w-[180px] items-center gap-1.5 truncate text-lg font-bold text-slate-800"
              title="Tap to rename"
            >
              <span className="truncate">{card.name}</span>
              <PencilIcon className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            </button>
          )}

          <div className="relative">
            <button type="button" onClick={() => setOverflow((o) => !o)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="More">
              <MoreIcon className="h-5 w-5" />
            </button>
            {overflow && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOverflow(false)} />
                <div className="absolute right-0 top-12 z-40 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => { setOverflow(false); setTitleDraft(card.name); setEditingTitle(true) }}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Rename card
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteCard}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete card
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {flash && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700">
            {flash}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
            <button type="button" onClick={() => setError(null)} className="text-xs font-bold text-red-500 hover:underline">
              Dismiss
            </button>
          </div>
        )}
        {readError && !error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              Could not load saved attendance from Firestore ({readError.code || readError.message}).
              Check that your Firestore security rules allow reads and that you're signed in.
            </p>
          </div>
        )}

        {tip && (
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-2.5">
            <p className="text-sm text-emerald-700">Tip: Swipe left-right here to change month</p>
            <button type="button" onClick={() => setTip(false)} className="text-xs font-bold text-emerald-700 hover:underline">
              Got it
            </button>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="flex items-center gap-1 rounded-full border-2 border-emerald-500 px-3.5 py-1.5 text-xs font-bold tracking-wide text-emerald-600 transition hover:bg-emerald-50"
          >
            <ChevronLeft className="h-4 w-4" /> PREV
          </button>
          <h2 className="text-base font-black tracking-widest text-slate-800">{monthKey}</h2>
          <button
            type="button"
            onClick={nextMonth}
            className="flex items-center gap-1 rounded-full border-2 border-emerald-500 px-3.5 py-1.5 text-xs font-bold tracking-wide text-emerald-600 transition hover:bg-emerald-50"
          >
            NEXT <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div
          className="card p-3"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - (touchX.current ?? 0)
            if (Math.abs(dx) > 60) dx < 0 ? nextMonth() : prevMonth()
          }}
        >
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, i) => (
              <DateCell
                key={i}
                day={day}
                inMonth={inCurrentMonth(day)}
                isToday={toDateKey(day) === todayKey}
                record={recordMap[toDateKey(day)]}
                onCycle={handleTap}
                onLongPress={setMenuDate}
              />
            ))}
          </div>
        </div>

        {menuDate && (
          <ActionMenu
            dateKey={menuDate}
            record={recordMap[menuDate]}
            onSelect={mark}
            onClear={onClear}
            onClose={() => setMenuDate(null)}
          />
        )}

        {prompt?.type === 'ot' && (
          <PromptModal
            title="OverTime hours"
            label={`Hours for ${menuDate}`}
            initial="1"
            submitText="Save OT"
            onCancel={() => { setPrompt(null); setMenuDate(null) }}
            onSubmit={(v) => { const n = Number(v); if (n > 0 && n <= 24) onOvertime(n) }}
          />
        )}
        {prompt?.type === 'note' && (
          <PromptModal
            title="Add note"
            label={`Note for ${menuDate}`}
            multiline
            submitText="Save note"
            onCancel={() => { setPrompt(null); setMenuDate(null) }}
            onSubmit={onNote}
          />
        )}

        <div className="mt-5">
          <SummaryPanel
            records={monthRecords}
            onMoreInfo={() => setDetail(true)}
          />
        </div>

        {detail && (
          <InfoModal title={`${monthKey} detail`} onClose={() => setDetail(false)}>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-emerald-50 py-2">
                <div className="text-lg font-black text-emerald-700">{summary.counts.holiday}</div>
                <div className="text-[10px] font-semibold text-emerald-600">Holiday</div>
              </div>
              <div className="rounded-xl bg-slate-50 py-2">
                <div className="text-lg font-black text-slate-700">{summary.counts.weekly_off}</div>
                <div className="text-[10px] font-semibold text-slate-500">Weekly Off</div>
              </div>
              <div className="rounded-xl bg-amber-50 py-2">
                <div className="text-lg font-black text-amber-700">{summary.counts.leave}</div>
                <div className="text-[10px] font-semibold text-amber-600">Leave</div>
              </div>
            </div>
            {monthRecords.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No marks for this month yet.</p>
            ) : (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                {[...monthRecords].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-600">{formatLong(r.date)}</span>
                    <span className="flex items-center gap-2">
                      {r.note && <span className="max-w-[120px] truncate text-xs text-slate-400">“{r.note}”</span>}
                      <span className="font-semibold text-slate-800">
                        {r.status ? STATUS_LABELS[r.status] : 'Note'}
                        {r.status === 'overtime' && r.otHours ? ` · ${r.otHours}h` : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </InfoModal>
        )}
      </main>
    </div>
  )
}