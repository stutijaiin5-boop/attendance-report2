import { useState } from 'react'
import { summarizeRecords } from '../utils/attendanceMath'
import { ChevronDown, InfoIcon } from './icons'

// Swatch row: label, count, colored square
function Row({ label, count, swatch }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5">
        <span className={`h-4 w-4 rounded ${swatch}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-800">{count}</span>
    </div>
  )
}

export default function SummaryPanel({ records, onMoreInfo }) {
  const [open, setOpen] = useState(true)
  const { counts, otHours, otDays, percent } = summarizeRecords(records)

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-bold text-slate-700">Attendance for this month</span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          <Row label="Present" count={counts.present} swatch="bg-emerald-500" />
          <Row label="Absent" count={counts.absent} swatch="bg-red-500" />
          <Row label="Half Days" count={counts.half_day} swatch="bg-orange-400" />
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-[8px] font-black text-white">OT</span>
              <span className="text-sm text-slate-600">OT</span>
            </div>
            <span className="text-sm font-bold text-slate-800">
              {otHours} hrs - {otDays} days
            </span>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Percentage</span>
              <span className="text-xl font-black text-emerald-700">{percent}%</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">
              (Present + Half Day × 0.5) ÷ (Present + Absent + Half Day) — excludes
              Holiday, Weekly Off, Leave, OT and unmarked days.
            </p>
          </div>

          <button
            type="button"
            onClick={onMoreInfo}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            <InfoIcon className="h-4 w-4" />
            More Info
          </button>
        </div>
      )}
    </div>
  )
}