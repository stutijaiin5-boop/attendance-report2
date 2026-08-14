import { Link } from 'react-router-dom'
import ProgressRing from './ProgressRing'
import { ringColor } from '../utils/attendanceMath'

export default function SubjectCard({ subject, stats }) {
  const low = stats.isLow
  const color = ringColor(stats.percent, subject.targetPercent)

  return (
    <Link
      to={`/subject/${subject.id}`}
      className="card group relative block p-4 transition hover:border-emerald-300 hover:shadow-md"
    >
      {low && (
        <span className="absolute -top-2 right-3 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Below target
        </span>
      )}
      <div className="flex items-center gap-4">
        <ProgressRing percent={stats.percent} size={64} stroke={6} color={color} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-800">{subject.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {stats.present}/{stats.held} classes · target {subject.targetPercent}%
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stats.safeToBunk > 0 && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Safe to bunk {stats.safeToBunk}
              </span>
            )}
            {stats.needToAttend > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Need {stats.needToAttend} straight
              </span>
            )}
            {stats.held === 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                No classes yet
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}