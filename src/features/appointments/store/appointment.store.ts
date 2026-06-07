import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentStatus,
  CreateAppointmentInput,
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

  async function fetchList(query: Omit<AppointmentListQuery, 'from' | 'to'> & { from: number; to: number }): Promise<void> {
    if (!auth.userId) return
    loading.value = true
    error.value = null
    const result = await service.list(auth.userId, query)
    loading.value = false
    if (isOk(result)) {
      items.value = result.value.items
      total.value = result.value.total
    } else {
      error.value = result.error
    }
  }

  async function create(input: CreateAppointmentInput): Promise<Appointment | null> {
    if (!auth.userId) return null
    saving.value = true
    error.value = null
    const result = await service.create(auth.userId, input)
    saving.value = false
    if (isOk(result)) return result.value
    error.value = result.error
    return null
  }

  async function update(id: string, input: UpdateAppointmentInput): Promise<Appointment | null> {
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

  async function setStatus(id: string, status: AppointmentStatus): Promise<boolean> {
    const result = await service.setStatus(id, status)
    if (isOk(result)) {
      patchLocal(result.value)
      return true
    }
    error.value = result.error
    return false
  }

  async function remove(id: string): Promise<boolean> {
    const result = await service.remove(id)
    if (isOk(result)) {
      items.value = items.value.filter((a) => a.id !== id)
      return true
    }
    error.value = result.error
    return false
  }

  function patchLocal(updated: Appointment): void {
    const idx = items.value.findIndex((a) => a.id === updated.id)
    if (idx !== -1) items.value[idx] = updated
  }

  return { items, total, loading, saving, error, fetchList, create, update, setStatus, remove }
})
