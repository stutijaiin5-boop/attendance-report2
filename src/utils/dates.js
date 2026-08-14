export function toDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d, n) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export function todayMidnight() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Sunday-first month grid (42 cells)
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

export function monthLabel(year, month) {
  return `${MONTH_NAMES[month]} ${year}`
}

export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function formatLong(key) {
  const d = fromDateKey(key)
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}