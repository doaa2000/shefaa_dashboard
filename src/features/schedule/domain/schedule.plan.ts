/**
 * The arithmetic behind a working day, kept apart from wording and the
 * database so it can be tested on its own.
 *
 * Everything here answers one question: given the hours a doctor typed and the
 * one number that goes with them, what will the patient app offer? The app
 * does not work this out itself -- it reads doctor_sessions_on, which cuts the
 * row in the database -- so the rules below mirror that function, and the
 * tests hold them to it.
 */

export type Session = 'morning' | 'evening'

/**
 * Where the morning ends. A day that starts before one o'clock is the morning
 * one, anything later is the evening.
 *
 * One o'clock because that is the line the seed already draws (seed.sql splits the
 * old per-date rows with `slot < time '13:00'`), and it fits how Egyptian
 * clinics run: a morning list from nine or ten that ends early afternoon, and
 * an evening one from four or five. Noon would push a 12:00-16:00 list into
 * the evening, which nobody calls it.
 */
export const EVENING_FROM = 13 * 60

/** "09:30" or "09:30:00" as minutes since midnight. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Minutes since midnight back to "HH:MM", the form the database takes. */
export function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Which of the two sessions a day with these hours is.
 *
 * The doctor is no longer asked: they know when they start, and "morning" is
 * only a name for that. The column still matters -- one row per day and
 * session is the database's rule, and a closure can shut just one of the two --
 * so it is worked out rather than dropped.
 */
export function sessionFor(startTime: string): Session {
  return toMinutes(startTime) < EVENING_FROM ? 'morning' : 'evening'
}

/** What a fixed-length day comes to. */
export interface SlotPlan {
  /** How many appointments fit whole. Zero when not even one does. */
  count: number
  /** When each one starts, "HH:MM". */
  starts: string[]
  /** When the last one ends, which is where the day now ends. */
  lastEnd: string
  /** Minutes between the last appointment and the end the doctor typed. */
  leftover: number
}

/**
 * Cuts the hours into appointments of exactly the given length.
 *
 * Only whole appointments count. The database, given a length that does not
 * divide the hours, makes one more window and shrinks them all to fit -- so
 * twenty minutes over 9:00-14:30 comes out as seventeen windows of 19 and a bit
 * minutes, and the patient sees 9:19 and 9:38. Nobody asked for that. Saving
 * the day to end where the last whole appointment does keeps every
 * appointment the length the doctor said, and the few minutes after it are
 * simply not offered; the form says so before it is saved.
 */
export function planSlots(startTime: string, endTime: string, slotMinutes: number): SlotPlan {
  const start = toMinutes(startTime)
  const span = toMinutes(endTime) - start
  const count = span > 0 && slotMinutes > 0 ? Math.floor(span / slotMinutes) : 0
  return {
    count,
    starts: Array.from({ length: count }, (_, i) => fromMinutes(start + i * slotMinutes)),
    lastEnd: fromMinutes(start + count * slotMinutes),
    leftover: span > 0 ? span - count * slotMinutes : 0,
  }
}

/** The row a working day becomes. */
export interface PlannedRow {
  session: Session
  startTime: string
  endTime: string
  capacity: number
  slotMinutes: number | null
}

/**
 * The one number the doctor typed, turned into the row the database keeps.
 *
 * By queue, the number is how many patients, and that is the capacity. With
 * fixed appointments the number is the length, and the capacity is how many
 * appointments that makes: the database spreads capacity across the windows
 * (doctor_sessions_on, "10 places over 3 windows gives 3, 3, 4") and leaves out
 * any window that gets none. A capacity typed separately from the length is
 * how a day of fifteen appointments with ten patients lost five of them
 * without anybody seeing it. One place per appointment, always, is the only
 * capacity that shows every appointment once.
 *
 * Null when the hours do not hold even one appointment.
 */
export function planRow(
  startTime: string,
  endTime: string,
  slotMinutes: number | null,
  patients: number,
): PlannedRow | null {
  if (toMinutes(endTime) <= toMinutes(startTime)) return null
  const session = sessionFor(startTime)

  if (slotMinutes === null) {
    return { session, startTime, endTime, capacity: patients, slotMinutes: null }
  }

  const plan = planSlots(startTime, endTime, slotMinutes)
  if (plan.count === 0) return null
  return {
    session,
    startTime,
    endTime: plan.lastEnd,
    capacity: plan.count,
    slotMinutes,
  }
}

/** A window as doctor_sessions_on hands it to the patient app. */
export interface OfferedWindow {
  /** "HH:MM", minutes cut off rather than rounded, as the app prints them. */
  start: string
  capacity: number
}

/**
 * What the database will offer for a row, worked the way doctor_sessions_on
 * works it (0053): ceil(span / length) windows, the span divided evenly among
 * them, the capacity divided by running total, and windows left with no
 * capacity dropped.
 *
 * Used to check that a planned row shows exactly its appointments, and to
 * notice a row saved before this rule that does not.
 */
export function offeredWindows(row: {
  startTime: string
  endTime: string
  capacity: number
  slotMinutes: number | null
}): OfferedWindow[] {
  const start = toMinutes(row.startTime)
  const span = toMinutes(row.endTime) - start
  if (span <= 0) return []
  const n =
    row.slotMinutes === null ? 1 : Math.max(Math.ceil(span / row.slotMinutes), 1)

  const windows: OfferedWindow[] = []
  for (let i = 0; i < n; i++) {
    // Integer arithmetic on (start * n + span * i) / n keeps this exact; the
    // app prints the minute and drops the seconds, so the floor is what shows.
    const at = Math.floor((start * n + span * i) / n)
    const capacity =
      Math.floor((row.capacity * (i + 1)) / n) - Math.floor((row.capacity * i) / n)
    if (capacity > 0) windows.push({ start: fromMinutes(at), capacity })
  }
  return windows
}

/**
 * Whether a fixed-length row offers each appointment once, at the length the
 * doctor set. A row saved before the length decided the capacity may not:
 * some appointments missing, some holding two, or all of them a few minutes
 * short.
 */
export function rowMatchesLength(row: {
  startTime: string
  endTime: string
  capacity: number
  slotMinutes: number | null
}): boolean {
  if (row.slotMinutes === null) return true
  const span = toMinutes(row.endTime) - toMinutes(row.startTime)
  return span > 0 && span % row.slotMinutes === 0 && row.capacity === span / row.slotMinutes
}

/** Why a day cannot take these hours, before the database is asked. */
export type Conflict =
  /** The day already has hours in the same session; the database allows one. */
  | { kind: 'sameSession'; withId: number }
  /** The hours run into the day's other session. */
  | { kind: 'overlap'; withId: number }

/**
 * Checks one weekday's existing rows against new hours.
 *
 * The database would refuse the first case with a duplicate key and let the
 * second one through, leaving a day whose two halves overlap. Both are better
 * said to the doctor in words, naming the day.
 */
export function conflictOn(
  existing: { id: number; weekday: number; session: string; startTime: string; endTime: string }[],
  weekday: number,
  row: { session: string; startTime: string; endTime: string },
  ignoreId?: number,
): Conflict | null {
  const start = toMinutes(row.startTime)
  const end = toMinutes(row.endTime)
  for (const e of existing) {
    if (e.weekday !== weekday || e.id === ignoreId) continue
    if (e.session === row.session) return { kind: 'sameSession', withId: e.id }
    if (start < toMinutes(e.endTime) && toMinutes(e.startTime) < end) {
      return { kind: 'overlap', withId: e.id }
    }
  }
  return null
}

/**
 * The times to show in a preview: all of them when there are few, otherwise
 * the first three and the last, with a gap marked between. Eighteen times in a
 * row is a list nobody reads; the first few say the rhythm and the last says
 * where it stops.
 */
export function sampleTimes(starts: string[]): { head: string[]; last: string | null } {
  if (starts.length <= 5) return { head: starts, last: null }
  return { head: starts.slice(0, 3), last: starts[starts.length - 1] }
}
