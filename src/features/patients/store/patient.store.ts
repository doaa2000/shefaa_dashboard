import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { Patient } from '../domain/patient.models'

export const usePatientStore = defineStore('patients', () => {
  const service = container.patientService

  const items = ref<Patient[]>([])
  const current = ref<Patient | null>(null)
  const loading = ref(false)
  const error = ref<AppError | null>(null)

  async function fetchList(search?: string): Promise<void> {
    loading.value = true
    error.value = null
    const result = await service.listForDoctor(search)
    loading.value = false
    if (isOk(result)) items.value = result.value
    else error.value = result.error
  }

  async function fetchOne(id: string): Promise<void> {
    loading.value = true
    error.value = null
    const result = await service.getById(id)
    loading.value = false
    if (isOk(result)) current.value = result.value
    else error.value = result.error
  }

  return { items, current, loading, error, fetchList, fetchOne }
})
