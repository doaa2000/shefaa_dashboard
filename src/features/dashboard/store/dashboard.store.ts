import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { DashboardSummary } from '../domain/dashboard.models'

export const useDashboardStore = defineStore('dashboard', () => {
  const service = container.dashboardService

  const summary = ref<DashboardSummary | null>(null)
  const loading = ref(false)
  const error = ref<AppError | null>(null)

  async function fetchSummary(): Promise<void> {
    loading.value = true
    error.value = null
    const result = await service.getSummary()
    loading.value = false
    if (isOk(result)) summary.value = result.value
    else error.value = result.error
  }

  return { summary, loading, error, fetchSummary }
})
