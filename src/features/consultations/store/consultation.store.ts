import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type {
  Consultation,
  ConsultationListQuery,
  CreateConsultationInput,
  UpdateConsultationInput,
} from '../domain/consultation.models'

export const useConsultationStore = defineStore('consultations', () => {
  const service = container.consultationService
  const auth = useAuthStore()

  const items = ref<Consultation[]>([])
  const total = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<AppError | null>(null)

  async function fetchList(query: ConsultationListQuery): Promise<void> {
    if (!auth.doctorId) return
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

  async function create(input: CreateConsultationInput): Promise<Consultation | null> {
    if (!auth.doctorId) return null
    saving.value = true
    error.value = null
    const result = await service.create(auth.doctorId, input)
    saving.value = false
    if (isOk(result)) return result.value
    error.value = result.error
    return null
  }

  async function update(id: string, input: UpdateConsultationInput): Promise<Consultation | null> {
    saving.value = true
    error.value = null
    const result = await service.update(id, input)
    saving.value = false
    if (isOk(result)) return result.value
    error.value = result.error
    return null
  }

  async function remove(id: string): Promise<boolean> {
    const result = await service.remove(id)
    if (isOk(result)) {
      items.value = items.value.filter((c) => c.id !== id)
      return true
    }
    error.value = result.error
    return false
  }

  return { items, total, loading, saving, error, fetchList, create, update, remove }
})
