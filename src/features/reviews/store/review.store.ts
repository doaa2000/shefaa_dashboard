import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { DoctorReview } from '../domain/review.models'

export const useReviewStore = defineStore('reviews', () => {
  const service = container.reviewService
  const auth = useAuthStore()

  const items = ref<DoctorReview[]>([])
  const loading = ref(false)
  const error = ref<AppError | null>(null)

  const average = computed(() =>
    items.value.length === 0
      ? 0
      : items.value.reduce((sum, r) => sum + r.stars, 0) / items.value.length,
  )

  const withNotes = computed(() => items.value.filter((r) => r.comment !== null).length)

  async function fetchList(): Promise<void> {
    if (!auth.doctorId) return
    loading.value = true
    error.value = null
    const result = await service.list(auth.doctorId)
    loading.value = false
    if (isOk(result)) {
      items.value = result.value
    } else {
      error.value = result.error
      items.value = []
    }
  }

  return { items, loading, error, average, withNotes, fetchList }
})
