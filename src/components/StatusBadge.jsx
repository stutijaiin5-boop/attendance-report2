const STYLES = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  cancelled: 'bg-amber-100 text-amber-700',
}

const LABELS = { present: 'Present', absent: 'Absent', cancelled: 'Cancelled' }

export default function StatusBadge({ status, short = false }) {
  if (!status) return null
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {short ? status[0].toUpperCase() : LABELS[status]}
    </span>
  )
}