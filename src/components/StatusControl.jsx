const OPTIONS = [
  { value: 'present', label: 'Present', active: 'bg-emerald-600 text-white', dot: 'bg-emerald-600' },
  { value: 'absent', label: 'Absent', active: 'bg-red-600 text-white', dot: 'bg-red-600' },
  { value: 'cancelled', label: 'Cancel', active: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
]

// Buttons to set a record. Clicking the active status again clears it.
export default function StatusControl({ status, onChange, compact = false }) {
  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((o) => {
        const active = status === o.value
        const base = compact
          ? 'rounded-lg px-2 py-1 text-xs font-semibold transition'
          : 'rounded-xl px-3 py-1.5 text-xs font-semibold transition'
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(active ? null : o.value)}
            className={`${base} ${
              active
                ? `${o.active} shadow-sm`
                : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}