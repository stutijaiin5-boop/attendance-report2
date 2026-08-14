import { useState } from 'react'
import { STATUS_LABELS } from '../utils/attendanceMath'
import {
  ArrowIcon, BackIcon, BriefcaseIcon, CalendarIcon, CheckIcon, ClearIcon,
  ClockPlusIcon, CloseIcon, HomeIcon, LeaveIcon, PencilIcon, ShiftIcon,
} from './icons'

const MAIN_ITEMS = [
  { key: 'present', icon: CheckIcon, color: 'text-emerald-600', label: 'Present' },
  { key: 'absent', icon: CloseIcon, color: 'text-red-600', label: 'Absent' },
  { key: 'half_day', icon: CalendarIcon, color: 'text-orange-500', label: 'Half Day' },
  { key: 'overtime', icon: ClockPlusIcon, color: 'text-emerald-600', label: 'OverTime' },
  { key: 'shift', icon: ShiftIcon, color: 'text-slate-600', label: 'Shift', submenu: true },
  { key: 'more', icon: ArrowIcon, color: 'text-slate-600', label: 'More Options', submenu: true },
]

const MORE_ITEMS = [
  { key: 'holiday', icon: HomeIcon, color: 'text-red-600', label: 'Holiday' },
  { key: 'weekly_off', icon: BriefcaseIcon, color: 'text-red-600', label: 'Weekly Off' },
  { key: 'leave', icon: LeaveIcon, color: 'text-slate-600', label: 'Leave', submenu: true },
  { key: 'note', icon: PencilIcon, color: 'text-slate-600', label: 'Note' },
]

function MenuRow({ item, onSelect }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
      onClick={() => onSelect(item)}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 ${item.color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 text-sm font-semibold text-slate-700">{item.label}</span>
      {item.submenu && <ArrowIcon className="h-4 w-4 text-slate-300" />}
    </button>
  )
}

function ComingSoon({ title, onBack }) {
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <BackIcon className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
        Coming soon
      </p>
    </>
  )
}

// Bottom-sheet action menu for a tapped date.
// onSelect(status, extras) — e.g. onSelect('overtime', { otHours }) / onSelect('note', { note: text })
export default function ActionMenu({ dateKey, record, onSelect, onClear, onClose }) {
  const [page, setPage] = useState('main') // 'main' | 'more' | 'shift' | 'leave'

  const currentStatus = record?.status ? STATUS_LABELS[record.status] : 'Unmarked'

  const pick = (item) => {
    if (item.key === 'shift') return setPage('shift')
    if (item.key === 'more') return setPage('more')
    if (item.key === 'leave') return setPage('leave')
    onSelect(item.key, {})
  }

  const pickMore = (item) => {
    if (item.key === 'leave') return setPage('leave')
    if (item.key === 'note') return onSelect('note', {})
    onSelect(item.key, {})
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          {page !== 'main' && (
            <button type="button" onClick={() => setPage('main')} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <BackIcon className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 text-center">
            <h2 className="text-sm font-bold text-slate-800">{dateKey}</h2>
            <p className="text-xs text-slate-400">{currentStatus}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-2">
          {page === 'main' && MAIN_ITEMS.map((item) => <MenuRow key={item.key} item={item} onSelect={pick} />)}
          {page === 'more' && (
            <>
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">More options</p>
              {MORE_ITEMS.map((item) => <MenuRow key={item.key} item={item} onSelect={pickMore} />)}
            </>
          )}
          {(page === 'shift' || page === 'leave') && (
            <ComingSoon title={page === 'shift' ? 'Shift' : 'Leave'} onBack={() => setPage('main')} />
          )}
        </div>

        {page === 'main' && (
          <button
            type="button"
            onClick={onClear}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <ClearIcon className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-slate-700">Clear</span>
          </button>
        )}
      </div>
    </div>
  )
}