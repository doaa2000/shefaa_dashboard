import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type {
  ScheduleEntry,
  CreateScheduleInput,
  UpdateScheduleInput,
} from '../domain/schedule.models'
import { weekdayOptions } from '../domain/schedule.models'
import { planRow } from '../domain/schedule.plan'
import type {
  ScheduleClosure,
  CreateClosureInput,
  BookedInClosure,
} from '../domain/schedule.models'

export const useScheduleStore = defineStore('schedules', () => {
  const service = container.scheduleService
  const auth = useAuthStore()

  const items = ref<ScheduleEntry[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<AppError | null>(null)

  /** The week in order, so the list reads like a week rather than insertion order. */
  const byWeekday = computed(() =>
    weekdayOptions().map((day) => ({
      ...day,
      entries: items.value
        .filter((e) => e.weekday === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    })),
  )

  const totalWeeklyCapacity = computed(() =>
    items.value.filter((e) => e.isActive).reduce((sum, e) => sum + e.capacity, 0),
  )

  /**
   * How this clinic books, read back from the week.
   *
   * It is held on every row rather than in a place of its own, so this is the
   * value they agree on. An empty week has no answer yet and reads as the
   * whole window, which is what a new row would be anyway.
   *
   * A week that disagrees with itself can only come from outside this page --
   * it is written across all rows at once here -- and taking the first row's
   * answer is the one that matches what the doctor would see at the top of
   * the list.
   */
  const bookingMode = computed<number | null>(() =>
    items.value.length ? items.value[0].slotMinutes : null,
  )

  /** True while the week does not agree, which this page then offers to settle. */
  const bookingModeMixed = computed(
    () => new Set(items.value.map((e) => e.slotMinutes)).size > 1,
  )

  /**
   * The days whose hours would not hold one appointment of this length, and
   * so cannot be switched to it. Asked before saving, so the doctor is told
   * which days to fix instead of finding half the week changed.
   */
  function rowsTooShortFor(slotMinutes: number): ScheduleEntry[] {
    return items.value.filter(
      (e) => planRow(e.startTime, e.endTime, slotMinutes, e.capacity) === null,
    )
  }

  /**
   * Writes one answer across the whole week.
   *
   * Every row, not the active ones: a paused day resumed next month would
   * otherwise come back running on the arrangement the clinic has left behind.
   *
   * By queue it is the one column, written at once. A length is more than
   * that: each day's capacity becomes its number of appointments and its end
   * moves to where the last whole one finishes (planRow), or the database
   * would spread the old patient count over the new appointments and drop the
   * ones it ran out for. That is a different value per row, so the rows are
   * written one by one; one that fails leaves the week mixed, which the card
   * already says and offers to settle.
   */
  async function setBookingMode(slotMinutes: number | null): Promise<boolean> {
    if (!auth.doctorId) return false
    saving.value = true
    error.value = null

    if (slotMinutes === null) {
      const result = await service.setBookingMode(auth.doctorId, null)
      saving.value = false
      if (isOk(result)) {
        items.value = result.value
        return true
      }
      error.value = result.error
      return false
    }

    for (const entry of items.value) {
      const row = planRow(entry.startTime, entry.endTime, slotMinutes, entry.capacity)
      if (!row) continue
      const result = await service.update(entry.id, {
        slotMinutes,
        capacity: row.capacity,
        endTime: row.endTime,
      })
      if (isOk(result)) {
        items.value = items.value.map((e) => (e.id === entry.id ? result.value : e))
      } else {
        error.value = result.error
      }
    }
    saving.value = false
    return error.value === null
  }

  async function fetchList(): Promise<void> {
    if (!auth.doctorId) return
    loading.value = true
    error.value = null
    const result = await service.list(auth.doctorId)
    loading.value = false
    if (isOk(result)) items.value = result.value
    else error.value = result.error
  }

  /**
   * The same hours on several days, one row each.
   *
   * One at a time and carrying on past a failure: a doctor adding Sunday to
   * Thursday whose Tuesday is refused should still get the other four, and be
   * told which one did not go in and why.
   */
  async function createMany(
    weekdays: number[],
    input: Omit<CreateScheduleInput, 'weekday'>,
  ): Promise<{ added: number[]; failed: { weekday: number; error: AppError }[] }> {
    const added: number[] = []
    const failed: { weekday: number; error: AppError }[] = []
    if (!auth.doctorId) return { added, failed }
    saving.value = true
    error.value = null
    for (const weekday of weekdays) {
      const result = await service.create(auth.doctorId, { ...input, weekday })
      if (isOk(result)) {
        items.value = [...items.value, result.value]
        added.push(weekday)
      } else {
        failed.push({ weekday, error: result.error })
      }
    }
    saving.value = false
    return { added, failed }
  }

  async function update(id: number, input: UpdateScheduleInput): Promise<boolean> {
    saving.value = true
    error.value = null
    const result = await service.update(id, input)
    saving.value = false
    if (isOk(result)) {
      items.value = items.value.map((e) => (e.id === id ? result.value : e))
      return true
    }
    error.value = result.error
    return false
  }

  /** Pause a day without losing its times and capacity. */
  async function toggleActive(entry: ScheduleEntry): Promise<boolean> {
    return update(entry.id, { isActive: !entry.isActive })
  }

  /** Days off, kept beside the weekly pattern they interrupt. */
  const closures = ref<ScheduleClosure[]>([])

  async function fetchClosures(): Promise<void> {
    if (!auth.doctorId) return
    const result = await service.listClosures(auth.doctorId)
    if (isOk(result)) closures.value = result.value
    else error.value = result.error
  }

  /** Who is booked into that date already, and so will be cancelled by
   *  closing it. Null when it could not be found out: better to say nothing
   *  than to say "nobody is booked" about a day that is full. */
  async function bookingsOn(date: string, session: string | null): Promise<BookedInClosure | null> {
    if (!auth.doctorId) return null
    const result = await service.countBookingsOn(auth.doctorId, date, session)
    return isOk(result) ? result.value : null
  }

  async function addClosure(input: CreateClosureInput): Promise<boolean> {
    if (!auth.doctorId) return false
    saving.value = true
    error.value = null
    const result = await service.addClosure(auth.doctorId, input)
    saving.value = false
    if (isOk(result)) {
      closures.value = [...closures.value, result.value].sort((a, b) =>
        a.date.localeCompare(b.date),
      )
      return true
    }
    error.value = result.error
    return false
  }

  async function removeClosure(id: number): Promise<boolean> {
    const result = await service.removeClosure(id)
    if (isOk(result)) {
      closures.value = closures.value.filter((c) => c.id !== id)
      return true
    }
    error.value = result.error
    return false
  }

  async function remove(id: number): Promise<boolean> {
    const result = await service.remove(id)
    if (isOk(result)) {
      items.value = items.value.filter((e) => e.id !== id)
      return true
    }
    error.value = result.error
    return false
  }

  return {
    bookingMode,
    bookingModeMixed,
    setBookingMode,
    rowsTooShortFor,
    closures,
    fetchClosures,
    addClosure,
    removeClosure,
    bookingsOn,
    items,
    byWeekday,
    totalWeeklyCapacity,
    loading,
    saving,
    error,
    fetchList,
    createMany,
    update,
    toggleActive,
    remove,
  }
})
