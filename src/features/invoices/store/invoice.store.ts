import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { isOutstanding, type CommissionInvoice } from '../domain/invoice.models'

export const useInvoiceStore = defineStore('invoices', () => {
  const service = container.invoiceService

  const items = ref<CommissionInvoice[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<AppError | null>(null)

  /** Newest first, because the repository orders by period. */
  const outstanding = computed(() => items.value.filter(isOutstanding))

  const outstandingTotal = computed(() =>
    outstanding.value.reduce((sum, invoice) => sum + invoice.commission, 0),
  )

  /** The one the payments page names. The most recent unpaid invoice is the
   *  bill the doctor is being asked about now; older unpaid ones are in the
   *  total beside it. */
  const latestOutstanding = computed<CommissionInvoice | null>(() => outstanding.value[0] ?? null)

  const paidTotal = computed(() =>
    items.value
      .filter((invoice) => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.commission, 0),
  )

  async function fetchList(): Promise<void> {
    loading.value = true
    error.value = null
    const result = await service.list()
    loading.value = false
    loaded.value = true

    if (isOk(result)) {
      items.value = result.value
    } else {
      error.value = result.error
      items.value = []
    }
  }

  /** For the line on the payments page: it needs the figure, not a reload on
   *  every visit. */
  async function ensureLoaded(): Promise<void> {
    if (loaded.value || loading.value) return
    await fetchList()
  }

  return {
    items,
    loading,
    loaded,
    error,
    outstanding,
    outstandingTotal,
    latestOutstanding,
    paidTotal,
    fetchList,
    ensureLoaded,
  }
})
