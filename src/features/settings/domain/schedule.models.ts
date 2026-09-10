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
   * How many patients the doctor takes in this session. Entered directly: a
   * dentist whose list mixes a short check with a long scaling knows their own
   * number better than an average visit length would predict it.
   */
  capacity: number
  isActive: boolean
}

export interface CreateScheduleInput {
  weekday: number
  session: string
  startTime: string
  endTime: string
  capacity: number
  isActive: boolean
}

export type UpdateScheduleInput = Partial<CreateScheduleInput>

/**
 * Only the two the database accepts. The old list offered "Afternoon", which
 * the session CHECK constraint rejects — picking it failed on save.
 */
export const SESSION_OPTIONS: { label: string; value: string }[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Evening', value: 'evening' },
]

export const WEEKDAY_OPTIONS: { label: string; value: number }[] = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_OPTIONS.find((d) => d.value === weekday)?.label ?? String(weekday)
}

/** Rough minutes per patient, so the doctor can sanity-check a capacity. */
export function minutesPerPatient(entry: ScheduleEntry): number | null {
  if (!entry.startTime || !entry.endTime || entry.capacity <= 0) return null
  const [sh, sm] = entry.startTime.split(':').map(Number)
  const [eh, em] = entry.endTime.split(':').map(Number)
  const minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes <= 0) return null
  return Math.round(minutes / entry.capacity)
}
