/** Date/time formatting helpers (Intl-based, locale-aware). */

import { intlLocale } from '@/app/i18n'

// Built per call rather than once at module load: the locale can change while
// the app is running, and a formatter captured at import time would keep
// printing the language the reader just switched away from.
function dateFmt() {
  return new Intl.DateTimeFormat(intlLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function timeFmt() {
  return new Intl.DateTimeFormat(intlLocale(), { hour: '2-digit', minute: '2-digit' })
}

function dateTimeFmt() {
  return new Intl.DateTimeFormat(intlLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return dateFmt().format(new Date(value))
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return timeFmt().format(new Date(value))
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return dateTimeFmt().format(new Date(value))
}

export function calculateAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}

export function startOfDayISO(date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function endOfDayISO(date = new Date()): string {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export function toDatetimeLocalValue(value: string | Date): string {
  const d = new Date(value)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60_000)
  return local.toISOString().slice(0, 16)
}
