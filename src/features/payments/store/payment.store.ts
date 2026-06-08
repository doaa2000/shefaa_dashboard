import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { Payment } from '../domain/payment.models'

export const usePaymentStore = defineStore('payments', () => {
  const service = container.paymentService
  const auth = useAuthStore()

  const items = ref<Payment[]>([])
  const totalAmount = ref(0)
  const loading = ref(false)
  const error = ref<AppError | null>(null)

  async function fetchList(): Promise<void> {
    if (!auth.doctorId) return
    loading.value = true
    error.value = null
    const result = await service.listForDoctor(auth.doctorId)
    loading.value = false
    if (isOk(result)) {
      items.value = result.value.items
      totalAmount.value = result.value.totalAmount
    } else {
      error.value = result.error
    }
  }

  return { items, totalAmount, loading, error, fetchList }
})
