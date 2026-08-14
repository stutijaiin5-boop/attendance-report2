// Deterministic attendance maths shared across the app. Pure functions so
// they can be unit-tested without Firebase.

export function computeSubjectStats(records = [], targetPercent = 75) {
  let present = 0
  let absent = 0
  for (const r of records) {
    if (r.status === 'present') present++
    else if (r.status === 'absent') absent++
  }

  const held = present + absent
  const percent = held === 0 ? 0 : (present / held) * 100
  const t = Math.min(Math.max(targetPercent / 100, 0.01), 0.99)

  // Extra classes that can be missed (become absent) while keeping
  // present / (held + bunks) >= target.
  const safeToBunk = held === 0 ? 0 : Math.floor((present * (1 - t)) / t - absent)

  // Consecutive classes that must be attended to climb back to target.
  const needToAttend =
    percent >= targetPercent ? 0 : Math.ceil((t * held - present) / (1 - t))

  return {
    present,
    absent,
    held,
    percent,
    safeToBunk: Math.max(0, safeToBunk),
    needToAttend: Math.max(0, needToAttend),
    isLow: held > 0 && percent < targetPercent,
  }
}

export function computeOverall(subjects = [], recordsBySubject = {}) {
  let present = 0
  let absent = 0
  for (const s of subjects) {
    const stats = computeSubjectStats(recordsBySubject[s.id] || [], s.targetPercent)
    present += stats.present
    absent += stats.absent
  }
  const held = present + absent
  return {
    present,
    absent,
    held,
    percent: held === 0 ? 0 : (present / held) * 100,
  }
}

// Consecutive days (counting back from today) on which every scheduled
// class was marked present. Days with cancelled classes don't break the
// streak; days with an absence do. Unscheduled days are skipped.
export function computeStreak(subjects = [], recordsBySubject = {}, today = new Date()) {
  let streak = 0
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  for (let i = 0; i < 400; i++) {
    const key = toLocalKey(cursor)
    let anyClass = false
    let anyAbsent = false

    for (const s of subjects) {
      if (!s.scheduledDays?.includes(cursor.getDay())) continue
      const rec = (recordsBySubject[s.id] || []).find((r) => r.date === key)
      if (rec) {
        anyClass = true
        if (rec.status === 'absent') {
          anyAbsent = true
          break
        }
      }
    }

    if (anyAbsent) break
    if (anyClass) streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function toLocalKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function ringColor(percent, targetPercent) {
  if (percent >= targetPercent) return '#059669' // emerald-600
  if (percent >= targetPercent - 10) return '#d97706' // amber-600
  return '#dc2626' // red-600
}

export function statusLabel(status) {
  return { present: 'Present', absent: 'Absent', cancelled: 'Cancelled' }[status] || 'Unmarked'
}