import { computed, ref, watch } from 'vue'
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

/** Milliseconds, for comparing two arrival times. Postgres and the browser
 *  write the same instant in different shapes, so the strings cannot be
 *  compared as they stand. */
function arrivedMs(e: Appointment): number {
  return e.arrivedAt ? Date.parse(e.arrivedAt) : Number.POSITIVE_INFINITY
}

/**
 * Those present, in the order they go in.
 *
 * The two kinds of session promise different things. A session taken whole
 * is first come, first seen -- the patient app tells them so -- so among one
 * window's people, whoever the desk marked as here first goes first, and a
 * late arrival who booked early waits behind those who were already in the
 * room. A session cut into appointments promises a time, so there the
 * earlier appointment goes first, whenever its holder walked in.
 *
 * `pinnedId` is whoever the screen already says it is the turn of. They keep
 * it until the desk marks them seen or absent, or takes back their arrival:
 * somebody with an earlier appointment turning up late becomes next, not
 * current, because the person already called in is not sent back out.
 */
export function orderPresent(present: QueueEntry[], pinnedId: number | null = null): QueueEntry[] {
  // A whole session's people sort as one block, placed where its first
  // booking sits in the day, and by arrival inside it. The blocks and the
  // appointments never interleave: the day is already in window order.
  const windowKey = (e: QueueEntry) => `${e.session}|${e.startTime}|${e.endTime}`
  const blockStart = new Map<string, number>()
  for (const e of present) {
    if (!e.wholeSession) continue
    const k = windowKey(e)
    blockStart.set(k, Math.min(blockStart.get(k) ?? e.position, e.position))
  }
  const placeOf = (e: QueueEntry) =>
    e.wholeSession ? (blockStart.get(windowKey(e)) ?? e.position) : e.position

  const ordered = [...present].sort((a, b) => {
    const byPlace = placeOf(a) - placeOf(b)
    if (byPlace !== 0) return byPlace
    if (a.wholeSession && b.wholeSession) {
      const byArrival = arrivedMs(a) - arrivedMs(b)
      if (byArrival !== 0) return byArrival
    }
    return a.position - b.position
  })

  const pinned = pinnedId === null ? -1 : ordered.findIndex((e) => e.id === pinnedId)
  if (pinned > 0) ordered.unshift(...ordered.splice(pinned, 1))
  return ordered
}

export function useQueue() {
  const store = useAppointmentStore()
  const { day, loadingDay, error } = storeToRefs(store)

  const date = ref(isoDay())

  /** Whose turn the screen last said it was. Held here rather than worked out
   *  afresh, so an arrival cannot take the turn from somebody already called;
   *  a reload starts again from the ordering rule, which is as good a guess. */
  const pinnedId = ref<number | null>(null)

  /**
   * The day, read as a queue.
   *
   * Cancellations are dropped rather than struck through. A booking called off
   * this morning is not part of today's room, and leaving it on the screen
   * makes a list of six look like a list of nine.
   *
   * `current` is the first of those the desk has marked as here and who have
   * not been seen, in the order `orderPresent` puts them. Somebody who booked
   * first and is still on the road holds nobody up.
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
      isPresent: !isDone(a) && a.arrivedAt !== null,
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
    const present = orderPresent(
      entries.filter((e) => e.isPresent),
      pinnedId.value,
    )

    return {
      date: date.value,
      windows,
      current: present[0] ?? null,
      next: present[1] ?? null,
      inLine: present,
      seen: entries.filter((e) => e.status === SEEN).length,
      present: present.length,
      notArrived: remaining.length - present.length,
      absent: entries.filter((e) => e.status === ABSENT).length,
      remaining,
    }
  })

  // Whoever the screen shows as current stays pinned until they leave the
  // present: seen, absent, or their arrival taken back.
  watch(
    () => queue.value.current?.id ?? null,
    (id) => {
      pinnedId.value = id
    },
    { immediate: true },
  )

  /** Gives somebody the turn back, for undoing a tap that took it from them. */
  function pin(id: number): void {
    pinnedId.value = id
  }

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
  /** Back into the queue, for the tap that landed on the wrong row. */
  const markWaiting = (id: number) => store.setDayStatus(id, 'confirmed')
  /** Puts a status back as it was, for an undo that must not guess. */
  const restoreStatus = (id: number, status: string) => store.setDayStatus(id, status)
  /** The desk's one other tap: they are here. And its undo. An undo passes
   *  the time they first arrived, so they keep their place by it. */
  const markArrived = (id: number, at: string = new Date().toISOString()) =>
    store.setDayArrived(id, at)
  const markNotArrived = (id: number) => store.setDayArrived(id, null)

  return {
    date,
    queue,
    loading: loadingDay,
    error,
    isToday: computed(() => date.value === isoDay()),
    nameOf,
    pin,
    load,
    setDate,
    markSeen,
    markAbsent,
    markWaiting,
    restoreStatus,
    markArrived,
    markNotArrived,
  }
}
