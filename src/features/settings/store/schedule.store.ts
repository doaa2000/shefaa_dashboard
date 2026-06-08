import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { AvailabilitySlot, CreateAvailabilityInput } from '../domain/schedule.models'

export const useScheduleStore = defineStore('schedules', () => {
  const service = container.scheduleService
  const auth = useAuthStore()

  const items = ref<AvailabilitySlot[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<AppError | null>(null)

  async function fetchList(): Promise<void> {
    if (!auth.doctorId) return
    loading.value = true
    error.value = null
    const result = await service.list(auth.doctorId)
    loading.value = false
    if (isOk(result)) items.value = result.value
    else error.value = result.error
  }

  async function create(input: CreateAvailabilityInput): Promise<boolean> {
    if (!auth.doctorId) return false
    saving.value = true
    error.value = null
    const result = await service.create(auth.doctorId, input)
    saving.value = false
    if (isOk(result)) {
      items.value = [...items.value, result.value]
      return true
    }
    error.value = result.error
    return false
  }

  async function remove(id: number): Promise<boolean> {
    const result = await service.remove(id)
    if (isOk(result)) {
      items.value = items.value.filter((s) => s.id !== id)
      return true
    }
    error.value = result.error
    return false
  }

  return { items, loading, saving, error, fetchList, create, remove }
})
