import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { Patient, PatientHistory } from '../domain/patient.models'

export const usePatientStore = defineStore('patients', () => {
  const service = container.patientService

  const items = ref<Patient[]>([])
  const current = ref<Patient | null>(null)
  const history = ref<PatientHistory | null>(null)
  const historyLoading = ref(false)
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
    // Cleared first: the previous patient's visits under a new patient's name
    // is the kind of mistake nobody catches.
    history.value = null
    const result = await service.getById(id)
    loading.value = false
    if (isOk(result)) current.value = result.value
    else error.value = result.error
  }

  /** Loaded separately so the details show while the history is still coming. */
  async function fetchHistory(id: string): Promise<void> {
    historyLoading.value = true
    const result = await service.getHistory(id)
    historyLoading.value = false
    if (isOk(result)) history.value = result.value
    else error.value = result.error
  }

  return {
    items,
    current,
    history,
    loading,
    historyLoading,
    error,
    fetchList,
    fetchOne,
    fetchHistory,
  }
})
