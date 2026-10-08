import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppointmentStore } from '../store/appointment.store'
import type {
  Appointment,
  DayQueue,
  QueueEntry,
  QueueWindow,
} from '../domain/appointment.models'

/** YYYY-MM-DD in the clinic's own day. toISOString hands back UTC, which after
 *  ten at night in Cairo is already tomorrow. */
export function isoDay(date = new Date()): string {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

/** HH:MM now, to compare against a window's own times. */
function clockNow(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const SEEN = 'completed'
const ABSENT = 'no_show'
const CANCELLED = 'cancelled'

/** Out of the queue: seen, called off, or never came. */
function isDone(a: Appointment): boolean {
  return a.status === SEEN || a.status === ABSENT || a.status === CANCELLED
}

export function useQueue() {
  const store = useAppointmentStore()
  const { day, loadingDay, error } = storeToRefs(store)

  const date = ref(isoDay())

  /**
   * The day, read as a queue.
   *
   * Cancellations are dropped rather than struck through. A booking called off
   * this morning is not part of today's room, and leaving it on the screen
   * makes a list of six look like a list of nine.
   *
   * `current` is the first booking nobody has marked. It is an inference and
   * the page says so: until an arrival time is recorded, nothing in the data
   * knows who is actually in the room, and the alternative -- showing nothing
   * -- helps nobody.
   */
  const queue = computed<DayQueue>(() => {
    const live = day.value.filter((a) => a.status !== CANCELLED)
    const now = clockNow()
    const isToday = date.value === isoDay()

    // Already ordered by the query; numbered here so the number survives the
    // grouping below.
    const entries: QueueEntry[] = live.map((a, i) => ({
      ...a,
      position: i + 1,
      isDone: isDone(a),
      isWaiting: !isDone(a),
    }))

    const windows: QueueWindow[] = []
    for (const entry of entries) {
      const last = windows[windows.length - 1]
      if (
        last &&
        last.session === entry.session &&
        last.startTime === entry.startTime &&
        last.endTime === entry.endTime
      ) {
        last.entries.push(entry)
        continue
      }
      windows.push({
        session: entry.session,
        startTime: entry.startTime,
        endTime: entry.endTime,
        entries: [entry],
        // A past date has started whatever the clock says; a future one has
        // not, however late in the day it is read.
        hasStarted: date.value < isoDay() || (isToday && entry.startTime <= now),
        isFinished: false,
      })
    }
    for (const w of windows) {
      w.isFinished = w.entries.every((e) => e.isDone)
    }

    const remaining = entries.filter((e) => e.isWaiting)

    return {
      date: date.value,
      windows,
      current: remaining[0] ?? null,
      next: remaining[1] ?? null,
      seen: entries.filter((e) => e.status === SEEN).length,
      absent: entries.filter((e) => e.status === ABSENT).length,
      waiting: remaining.length,
      remaining,
    }
  })

  /** What to call somebody: the account's name, then the name the clinic wrote
   *  down, then nothing worth pretending about. */
  function nameOf(entry: Appointment): string {
    return (entry.patientName ?? entry.walkInName ?? '').trim()
  }

  async function load(): Promise<void> {
    await store.fetchDay(date.value)
  }

  async function setDate(value: string): Promise<void> {
    date.value = value
    await load()
  }

  /** Both of these advance the queue, which is the whole reason the page is
   *  worth opening -- and the reason marking is worth doing. */
  const markSeen = (id: number) => store.setDayStatus(id, SEEN)
  const markAbsent = (id: number) => store.setDayStatus(id, ABSENT)
  /** Undo, for the tap that landed on the wrong row. */
  const markWaiting = (id: number) => store.setDayStatus(id, 'confirmed')

  return {
    date,
    queue,
    loading: loadingDay,
    error,
    isToday: computed(() => date.value === isoDay()),
    nameOf,
    load,
    setDate,
    markSeen,
    markAbsent,
    markWaiting,
  }
}
