import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import type {
  DateRange,
  MethodTotals,
  Payment,
  PaymentSummary,
  SettableStatus,
} from '../domain/payment.models'

/** YYYY-MM-DD in the clinic's own day. toISOString would hand back UTC, which
 *  after 10pm in Cairo is already tomorrow. */
function isoDay(date: Date): string {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export type RangePreset = 'today' | 'week' | 'month' | 'custom'

export function presetRange(preset: Exclude<RangePreset, 'custom'>): DateRange {
  const today = new Date()
  if (preset === 'today') return { from: isoDay(today), to: isoDay(today) }
  if (preset === 'week') {
    const from = new Date(today)
    from.setDate(from.getDate() - 6)
    return { from: isoDay(from), to: isoDay(today) }
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from: isoDay(from), to: isoDay(today) }
}

const emptySummary: PaymentSummary = {
  collected: 0,
  collectedOff: 0,
  outstanding: 0,
  refunded: 0,
  paidCount: 0,
  totalCount: 0,
  unpaidCount: 0,
  commission: 0,
  commissionable: 0,
  net: 0,
  unrated: 0,
}

export const usePaymentStore = defineStore('payments', () => {
  const service = container.paymentService

  const range = ref<DateRange>(presetRange('today'))
  const preset = ref<RangePreset>('today')

  const items = ref<Payment[]>([])
  const summary = ref<PaymentSummary>({ ...emptySummary })
  const byMethod = ref<MethodTotals[]>([])

  const loading = ref(false)
  /** Set while one row is being marked, so only that row's buttons wait. */
  const savingId = ref<number | null>(null)
  const error = ref<AppError | null>(null)

  const statusFilter = ref<string>('')
  const methodFilter = ref<string>('')

  /** Filtering happens here, not in the database: the figures above the table
   *  describe the whole range on purpose, and re-fetching on every filter
   *  change would make them flicker between two different answers. */
  const visibleItems = computed(() =>
    items.value.filter(
      (p) =>
        (!statusFilter.value || p.status === statusFilter.value) &&
        (!methodFilter.value || p.method === methodFilter.value),
    ),
  )

  async function fetchList(): Promise<void> {
    loading.value = true
    error.value = null
    const result = await service.listForRange(range.value)
    loading.value = false

    if (isOk(result)) {
      items.value = result.value.items
      summary.value = result.value.summary
      byMethod.value = result.value.byMethod
    } else {
      error.value = result.error
      items.value = []
      summary.value = { ...emptySummary }
      byMethod.value = []
    }
  }

  function setPreset(next: RangePreset): void {
    preset.value = next
    if (next !== 'custom') range.value = presetRange(next)
  }

  function setRange(next: DateRange): void {
    range.value = next
    preset.value = 'custom'
  }

  /** Marks one payment, then re-reads the range. The figures are computed by
   *  the database, and patching them here would be a second opinion about the
   *  same money. */
  async function setStatus(id: number, status: SettableStatus): Promise<boolean> {
    savingId.value = id
    error.value = null
    const result = await service.setStatus(id, status)
    savingId.value = null

    if (!isOk(result)) {
      error.value = result.error
      return false
    }

    await fetchList()
    return true
  }

  return {
    range,
    preset,
    items,
    visibleItems,
    summary,
    byMethod,
    loading,
    savingId,
    error,
    statusFilter,
    methodFilter,
    fetchList,
    setPreset,
    setRange,
    setStatus,
  }
})
