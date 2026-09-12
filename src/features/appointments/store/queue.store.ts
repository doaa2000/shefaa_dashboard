import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { Appointment, QueueEntry, SessionQueue } from '../domain/appointment.models'

/** Statuses that mean this patient is no longer waiting to be seen. */
const SETTLED = ['completed', 'no_show', 'cancelled']

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export const useQueueStore = defineStore('queue', () => {
  const service = container.appointmentService
  const auth = useAuthStore()

  const date = ref(todayIso())
  const items = ref<Appointment[]>([])
  const loading = ref(false)
  const advancing = ref<number | null>(null)
  const error = ref<AppError | null>(null)

  /**
   * The day's bookings, grouped by the window each one was booked into.
   *
   * Grouped by start_time rather than by session: a doctor who set an
   * appointment length has several windows inside one session, and lumping
   * them together would put a nine o'clock patient and a two o'clock one in
   * the same list.
   *
   * `position` is for reading the list, not for telling anybody. The patient's
   * app shows no number at all -- the clinic sees people in the order they
   * arrive, and the walk-ins are not in this table.
   */
  const sessions = computed<SessionQueue[]>(() => {
    const byWindow = new Map<string, QueueEntry[]>()

    for (const item of items.value) {
      const key = `${item.session}|${item.startTime}|${item.endTime}`
      const list = byWindow.get(key) ?? []
      list.push({ ...item, position: list.length + 1 })
      byWindow.set(key, list)
    }

    return [...byWindow.entries()]
      // Through the day, whatever order the rows arrived in.
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, entries]) => {
        const [session, startTime, endTime] = key.split('|')
        const waiting = entries.filter((e) => !SETTLED.includes(e.status))
        return {
          session,
          startTime,
          endTime,
          entries,
          current: waiting[0] ?? null,
          waiting: waiting.slice(1),
          done: entries.filter((e) => SETTLED.includes(e.status)),
        }
      })
  })

  const isEmpty = computed(() => !loading.value && items.value.length === 0)

  async function load(): Promise<void> {
    // An account with no doctor behind it is the commonest reason this page is
    // blank, and returning quietly here is what made it look like a bug in the
    // page rather than a link that was never made.
    if (!auth.doctorId) {
      items.value = []
      error.value = AppError.permission(
        'This account is not linked to a doctor yet, so there is no queue to show. ' +
          'Ask the administrator to add you with this email address.',
      )
      return
    }
    loading.value = true
    error.value = null
    const result = await service.listQueue(auth.doctorId, date.value)
    loading.value = false
    if (isOk(result)) items.value = result.value
    else error.value = result.error
  }

  /**
   * Records what happened to the patient being seen. The next one becomes
   * current on its own, because `current` is simply the first who is not
   * settled yet -- there is no pointer to move and so none to get stuck.
   */
  async function settle(id: number, status: 'completed' | 'no_show'): Promise<boolean> {
    advancing.value = id
    error.value = null
    const result = await service.setStatus(id, status)
    advancing.value = null

    if (isOk(result)) {
      const idx = items.value.findIndex((a) => a.id === id)
      if (idx !== -1) items.value[idx] = result.value
      return true
    }
    error.value = result.error
    return false
  }

  function setDate(next: string): void {
    date.value = next
  }

  return { date, items, loading, advancing, error, sessions, isEmpty, load, settle, setDate }
})
