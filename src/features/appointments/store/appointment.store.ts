import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type {
  Appointment,
  AppointmentListQuery,
  BookableWindow,
  ClinicBookingResult,
  RecordClinicBookingInput,
  UpdateAppointmentInput,
} from '../domain/appointment.models'

export const useAppointmentStore = defineStore('appointments', () => {
  const service = container.appointmentService
  const auth = useAuthStore()

  const items = ref<Appointment[]>([])
  const total = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<AppError | null>(null)

  async function fetchList(query: AppointmentListQuery): Promise<void> {
    // Same silent blank as the queue page had: no doctor behind the account
    // means no appointments, and saying nothing makes it look like a bug here.
    if (!auth.doctorId) {
      items.value = []
      total.value = 0
      error.value = AppError.permission(
        'This account is not linked to a doctor yet, so there are no appointments to show. ' +
          'Ask the administrator to add you with this email address.',
      )
      return
    }
    loading.value = true
    error.value = null
    const result = await service.list(auth.doctorId, query)
    loading.value = false
    if (isOk(result)) {
      items.value = result.value.items
      total.value = result.value.total
    } else {
      error.value = result.error
    }
  }

  async function update(id: number, input: UpdateAppointmentInput): Promise<Appointment | null> {
    saving.value = true
    error.value = null
    const result = await service.update(id, input)
    saving.value = false
    if (isOk(result)) {
      patchLocal(result.value)
      return result.value
    }
    error.value = result.error
    return null
  }

  async function setStatus(id: number, status: string): Promise<boolean> {
    const result = await service.setStatus(id, status)
    if (isOk(result)) {
      patchLocal(result.value)
      return true
    }
    error.value = result.error
    return false
  }

  async function remove(id: number): Promise<boolean> {
    const result = await service.remove(id)
    if (isOk(result)) {
      items.value = items.value.filter((a) => a.id !== id)
      return true
    }
    error.value = result.error
    return false
  }

  const windows = ref<BookableWindow[]>([])
  const loadingWindows = ref(false)

  /** One date's bookings, for the queue. Kept apart from `items`, which is
   *  the paged list the appointments page shows. */
  const day = ref<Appointment[]>([])
  const loadingDay = ref(false)

  async function fetchDay(date: string): Promise<void> {
    if (!auth.doctorId) {
      day.value = []
      return
    }
    loadingDay.value = true
    const result = await service.dayOf(auth.doctorId, date)
    loadingDay.value = false
    if (isOk(result)) {
      day.value = result.value
      error.value = null
    } else {
      error.value = result.error
    }
  }

  /** Moves one booking along and keeps the day in step, so the queue advances
   *  without a round trip for the whole list. */
  async function setDayStatus(id: number, status: string): Promise<boolean> {
    const result = await service.setStatus(id, status)
    if (isOk(result)) {
      const idx = day.value.findIndex((a) => a.id === id)
      if (idx >= 0) day.value[idx] = result.value
      patchLocal(result.value)
      return true
    }
    error.value = result.error
    return false
  }

  /** What the doctor is offering on one date. Cleared first, so a slow answer
   *  for a new date cannot be read as the answer for the old one. */
  async function fetchWindows(date: string): Promise<void> {
    windows.value = []
    if (!auth.doctorId || !date) return
    loadingWindows.value = true
    const result = await service.windowsOn(auth.doctorId, date)
    loadingWindows.value = false
    if (isOk(result)) windows.value = result.value
    else error.value = result.error
  }

  async function recordClinicBooking(
    input: RecordClinicBookingInput,
  ): Promise<ClinicBookingResult | null> {
    saving.value = true
    error.value = null
    const result = await service.recordClinicBooking(input)
    saving.value = false
    if (isOk(result)) return result.value
    error.value = result.error
    return null
  }

  function patchLocal(updated: Appointment): void {
    const idx = items.value.findIndex((a) => a.id === updated.id)
    if (idx !== -1) items.value[idx] = updated
  }

  return {
    items,
    total,
    loading,
    saving,
    error,
    windows,
    loadingWindows,
    day,
    loadingDay,
    fetchList,
    fetchDay,
    setDayStatus,
    update,
    setStatus,
    remove,
    fetchWindows,
    recordClinicBooking,
  }
})
