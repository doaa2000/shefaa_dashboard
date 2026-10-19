import { intlLocale, t } from '@/app/i18n'
import { offeredWindows } from './schedule.plan'

/**
 * A doctor's working week, backed by `doctor_schedule`.
 *
 * This replaces the old date-by-date availability rows. A week is a pattern, so
 * it is stored as one and availability for any date is computed from it — the
 * previous model needed a row per date and simply ran out after two weeks.
 */
export interface ScheduleEntry {
  id: number
  doctorId: number
  /** 0 = Sunday … 6 = Saturday, matching Postgres `extract(dow)`. */
  weekday: number
  session: string
  startTime: string
  endTime: string
  /**
   * How many patients the day holds. Typed by the doctor when booking by
   * queue; with fixed appointments it is the number of appointments, one place
   * each, because the database spreads it across them (see planRow).
   */
  capacity: number
  /**
   * How long each bookable appointment is, in minutes. Null means the session
   * is offered as one window from start to end, which is how a clinic that
   * sees people in the order they arrive actually runs.
   */
  slotMinutes: number | null
  isActive: boolean
}

export interface CreateScheduleInput {
  weekday: number
  session: string
  startTime: string
  endTime: string
  capacity: number
  slotMinutes: number | null
  isActive: boolean
}

export type UpdateScheduleInput = Partial<CreateScheduleInput>

/**
 * Only the two the database accepts. The old list offered "Afternoon", which
 * the session CHECK constraint rejects -- picking it failed on save.
 *
 * The working-hours form no longer asks: the session follows from the start
 * hour (sessionFor). A clinic booking and a closure still name one.
 */
export function sessionOptions(): { label: string; value: string }[] {
  return [
    { label: t('session.morning'), value: 'morning' },
    { label: t('session.evening'), value: 'evening' },
  ]
}

/** The shortest and longest appointment the form takes. */
export const MIN_LENGTH = 5
export const MAX_LENGTH = 240

/** What the patient is offered on this day, in a few words for the week list. */
export function rowSummary(entry: ScheduleEntry): string {
  if (entry.slotMinutes === null) return t('schedule.rowQueue', { count: entry.capacity })
  return t('schedule.rowSlots', {
    count: offeredWindows(entry).length,
    minutes: entry.slotMinutes,
  })
}

/**
 * A time as a clinic says it: "9:00 ص", not "09:00".
 *
 * The database wants 24-hour, the reader does not. Built through Intl so the
 * English side gets "9:00 AM" without a second table of words here.
 */
export function timeLabel(value: string): string {
  const [hours, minutes] = value.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value

  // An arbitrary date; only the clock on it is read.
  const at = new Date(2000, 0, 1, hours, minutes)
  return new Intl.DateTimeFormat(intlLocale(), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(at)
}

/** Days named together the way the language joins them: "الأحد والإثنين". */
export function dayList(weekdays: number[]): string {
  return new Intl.ListFormat(intlLocale(), { type: 'conjunction' }).format(
    weekdays.map(weekdayLabel),
  )
}

export function weekdayOptions(): { label: string; value: number }[] {
  return [0, 1, 2, 3, 4, 5, 6].map((value) => ({ label: weekdayLabel(value), value }))
}

export function weekdayLabel(weekday: number): string {
  const key = `weekday.${weekday}`
  const translated = t(key)
  return translated === key ? String(weekday) : translated
}

/**
 * A day, or one session of it, that the doctor is not working.
 *
 * Availability for every date is computed from the weekly pattern; this is how
 * a single date departs from it. A null session closes the whole day and wins
 * over a per-session row, which is what doctor_sessions_on already does with
 * it -- nothing here decides that, it only records it.
 */
export interface ScheduleClosure {
  id: number
  doctorId: number
  /** YYYY-MM-DD. */
  date: string
  /** 'morning', 'evening', or null for the whole day. */
  session: string | null
  reason: string | null
}

export interface CreateClosureInput {
  date: string
  session: string | null
  reason: string | null
}

/** Who is booked into what a closure would close. Closing cancels all of them;
 *  the ones with an app account are told by notification, and the ones the
 *  clinic wrote down by name and telephone are not, so the clinic calls them. */
export interface BookedInClosure {
  notified: number
  toCall: number
}

/** The whole day, or one of the two sessions. */
export const WHOLE_DAY = 'day'

export function closureScopeOptions(): { label: string; value: string }[] {
  return [
    { label: t('settings.wholeDay'), value: WHOLE_DAY },
    { label: t('session.morning'), value: 'morning' },
    { label: t('session.evening'), value: 'evening' },
  ]
}

export function toClosureSession(value: string): string | null {
  return value === WHOLE_DAY ? null : value
}
