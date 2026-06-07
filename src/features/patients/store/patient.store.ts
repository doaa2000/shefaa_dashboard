import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type {
  CreatePatientInput,
  Patient,
  UpdatePatientInput,
} from '../domain/patient.models'

export const usePatientStore = defineStore('patients', () => {
  const service = container.patientService
  const auth = useAuthStore()

  const items = ref<Patient[]>([])
  const total = ref(0)
  const current = ref<Patient | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<AppError | null>(null)

  async function fetchList(params: {
    search?: string
    isActive?: boolean
    from: number
    to: number
  }): Promise<void> {
    if (!auth.userId) return
    loading.value = true
    error.value = null
    const result = await service.list(auth.userId, params)
    loading.value = false
    if (isOk(result)) {
      items.value = result.value.items
      total.value = result.value.total
    } else {
      error.value = result.error
    }
  }

  async function fetchOne(id: string): Promise<void> {
    loading.value = true
    error.value = null
    const result = await service.getById(id)
    loading.value = false
    if (isOk(result)) current.value = result.value
    else error.value = result.error
  }

  async function create(input: CreatePatientInput): Promise<Patient | null> {
    if (!auth.userId) return null
    saving.value = true
    error.value = null
    const result = await service.create(auth.userId, input)
    saving.value = false
    if (isOk(result)) return result.value
    error.value = result.error
    return null
  }

  async function update(id: string, input: UpdatePatientInput): Promise<Patient | null> {
    saving.value = true
    error.value = null
    const result = await service.update(id, input)
    saving.value = false
    if (isOk(result)) {
      if (current.value?.id === id) current.value = result.value
      return result.value
    }
    error.value = result.error
    return null
  }

  async function remove(id: string): Promise<boolean> {
    const result = await service.remove(id)
    if (isOk(result)) {
      items.value = items.value.filter((p) => p.id !== id)
      return true
    }
    error.value = result.error
    return false
  }

  return { items, total, current, loading, saving, error, fetchList, fetchOne, create, update, remove }
})
