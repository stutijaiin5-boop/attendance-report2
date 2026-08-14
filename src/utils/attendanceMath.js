// Attendance summary maths. Pure functions so they can be unit-tested.

export function summarizeRecords(records = []) {
  const counts = {
    present: 0,
    absent: 0,
    half_day: 0,
    overtime: 0,
    holiday: 0,
    weekly_off: 0,
    leave: 0,
    notes: 0,
  }
  let otHours = 0
  let otDays = 0

  for (const r of records) {
    if (r.status === 'present') counts.present++
    else if (r.status === 'absent') counts.absent++
    else if (r.status === 'half_day') counts.half_day++
    else if (r.status === 'overtime') {
      counts.overtime++
      otHours += Number(r.otHours) || 1
      otDays++
    } else if (r.status === 'holiday') counts.holiday++
    else if (r.status === 'weekly_off') counts.weekly_off++
    else if (r.status === 'leave') counts.leave++
    if (r.note) counts.notes++
  }

  // (Present + Half Day × 0.5) / (Present + Absent + Half Day) × 100
  // Holiday / Weekly Off / Leave / OT / unmarked days are excluded.
  const denom = counts.present + counts.absent + counts.half_day
  const weighted = counts.present + counts.half_day * 0.5
  const percent = denom === 0 ? 0 : Math.round((weighted / denom) * 100)

  return { counts, otHours, otDays, percent }
}

export function badgeColor(percent) {
  if (percent >= 80) return '#059669' // green
  if (percent >= 60) return '#ea580c' // orange
  return '#dc2626' // red
}

export const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  overtime: 'OverTime',
  holiday: 'Holiday',
  weekly_off: 'Weekly Off',
  leave: 'Leave',
}