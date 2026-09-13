import { t } from '@/app/i18n'

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
 * the session CHECK constraint rejects — picking it failed on save.
 */
/** The select value that stands for "do not cut this session up at all". */
export const WHOLE_SESSION = 'whole'

export function sessionOptions(): { label: string; value: string }[] {
  return [
    { label: t('session.morning'), value: 'morning' },
    { label: t('session.evening'), value: 'evening' },
  ]
}

/**
 * How the session is offered to patients. "Whole session" is one window from
 * start to end: the patient is told when to arrive and the clinic works through
 * everyone in arrival order. A length cuts the session into appointments, for a
 * doctor who really does run to a clock.
 *
 * The values are strings because the select element only carries strings, and
 * because null -- the value that matters most here -- cannot be one of them.
 */
export function slotOptions(): { label: string; value: string }[] {
  return [
    { label: t('settings.wholeSession'), value: WHOLE_SESSION },
    { label: t('settings.minutes', { count: 15 }), value: '15' },
    { label: t('settings.minutes', { count: 20 }), value: '20' },
    { label: t('settings.minutes', { count: 30 }), value: '30' },
    { label: t('settings.oneHour'), value: '60' },
  ]
}

export function toSlotMinutes(value: string): number | null {
  return value === WHOLE_SESSION ? null : Number(value)
}

export function fromSlotMinutes(minutes: number | null): string {
  return minutes === null ? WHOLE_SESSION : String(minutes)
}

/** What the patient will be offered, in words. */
export function slotLabel(entry: ScheduleEntry): string {
  if (entry.slotMinutes === null) return t('settings.oneWindow')
  return t('settings.slotSplit', {
    count: windowCount(entry),
    minutes: entry.slotMinutes,
  })
}

/** How many appointments the session is cut into. */
export function windowCount(entry: ScheduleEntry): number {
  if (entry.slotMinutes === null) return 1
  const [sh, sm] = entry.startTime.split(':').map(Number)
  const [eh, em] = entry.endTime.split(':').map(Number)
  const minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes <= 0) return 1
  return Math.max(Math.ceil(minutes / entry.slotMinutes), 1)
}

export function weekdayOptions(): { label: string; value: number }[] {
  return [0, 1, 2, 3, 4, 5, 6].map((value) => ({ label: weekdayLabel(value), value }))
}

export function weekdayLabel(weekday: number): string {
  const key = `weekday.${weekday}`
  const translated = t(key)
  return translated === key ? String(weekday) : translated
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
