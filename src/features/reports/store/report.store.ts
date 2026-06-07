import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { AppointmentsTrend } from '../domain/report.models'

export const useReportStore = defineStore('reports', () => {
  const service = container.reportService

  const trend = ref<AppointmentsTrend | null>(null)
  const loading = ref(false)
  const error = ref<AppError | null>(null)

  async function fetchTrend(days = 30): Promise<void> {
    loading.value = true
    error.value = null
    const result = await service.appointmentsTrend(days)
    loading.value = false
    if (isOk(result)) trend.value = result.value
    else error.value = result.error
  }

  return { trend, loading, error, fetchTrend }
})
