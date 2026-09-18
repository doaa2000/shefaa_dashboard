<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useInvoiceStore } from '../../store/invoice.store'
import { useToast } from '@/shared/composables/useToast'
import { formatDate, formatDateTime } from '@/shared/utils/datetime'
import { formatMoney, formatNumber } from '@/shared/utils/formatters'
import { intlLocale } from '@/app/i18n'
import { coversWholeMonth, type CommissionInvoice } from '../../domain/invoice.models'
import { BaseBadge, BaseTable, type Column } from '@/shared/ui'

const store = useInvoiceStore()
const toast = useToast()
const { t } = useI18n()
const { items, loading, error, outstanding, outstandingTotal, paidTotal } = storeToRefs(store)

const columns = computed<Column[]>(() => [
  { key: 'period', label: t('invoices.columns.period') },
  { key: 'bookings', label: t('invoices.columns.bookings') },
  { key: 'fees', label: t('invoices.columns.fees'), align: 'right' },
  { key: 'commission', label: t('invoices.columns.commission'), align: 'right' },
  { key: 'status', label: t('invoices.columns.status'), align: 'center' },
])

/** A whole calendar month is named; anything else shows both its ends, so a
 *  part period never pretends to be a full month. */
function periodLabel(invoice: CommissionInvoice): string {
  if (coversWholeMonth(invoice.periodStart, invoice.periodEnd)) {
    return new Intl.DateTimeFormat(intlLocale(), { month: 'long', year: 'numeric' }).format(
      new Date(`${invoice.periodStart}T00:00:00`),
    )
  }
  return `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`
}

const statusTone = (status: CommissionInvoice['status']) =>
  status === 'paid' ? 'success' : status === 'void' ? 'neutral' : 'warning'

onMounted(() => store.fetchList())
watch(error, (e) => {
  if (e) toast.error(e.message ?? t('invoices.toast.loadFailed'))
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">{{ t('invoices.title') }}</h1>
      <p class="text-sm text-slate-500">{{ t('invoices.subtitle') }}</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <!-- What is owed right now, first and on its own: it is the only figure
           on this page that asks the doctor to do something. -->
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">{{ t('invoices.due') }}</p>
        <p
          class="mt-2 text-2xl font-semibold"
          :class="outstandingTotal > 0 ? 'text-amber-600' : 'text-emerald-600'"
        >
          {{ formatMoney(outstandingTotal) }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          {{
            outstanding.length
              ? t('invoices.dueCount', { count: formatNumber(outstanding.length) })
              : t('invoices.nothingDue')
          }}
        </p>
      </div>
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">{{ t('invoices.paidTotal') }}</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ formatMoney(paidTotal) }}</p>
        <p class="mt-1 text-xs text-slate-400">{{ t('invoices.paidTotalNote') }}</p>
      </div>
    </div>

    <!-- Where the number comes from, written once. A bill nobody can explain
         is a bill that gets argued with. -->
    <div class="rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
      <p class="text-sm font-medium text-primary-900">{{ t('invoices.howTitle') }}</p>
      <p class="mt-1 text-sm text-slate-600">{{ t('invoices.howBody') }}</p>
      <p class="mt-1 text-xs text-slate-500">{{ t('invoices.howSettle') }}</p>
    </div>

    <BaseTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      :empty-title="t('invoices.emptyTitle')"
      :empty-description="t('invoices.emptyBody')"
    >
      <template #cell:period="{ row }">
        <div>
          <p class="font-medium text-slate-800">{{ periodLabel(row) }}</p>
          <p class="text-xs text-slate-500">
            {{ t('invoices.issuedAt', { date: formatDate(row.issuedAt) }) }}
          </p>
        </div>
      </template>
      <template #cell:bookings="{ row }">
        <span class="text-slate-600">
          {{ t('invoices.bookingsCount', { count: formatNumber(row.bookings) }) }}
        </span>
      </template>
      <template #cell:fees="{ row }">
        <span class="text-slate-600">{{ formatMoney(row.fees) }}</span>
      </template>
      <template #cell:commission="{ row }">
        <span class="font-semibold text-slate-900">{{ formatMoney(row.commission) }}</span>
      </template>
      <template #cell:status="{ row }">
        <BaseBadge :tone="statusTone(row.status)">
          {{ t(`invoiceStatus.${row.status}`) }}
        </BaseBadge>
        <p v-if="row.status === 'paid' && row.paidAt" class="mt-1 text-xs text-slate-400">
          {{ formatDateTime(row.paidAt) }}
        </p>
        <!-- The owner's own words about how it was settled: this is the
             doctor's receipt, so it is shown rather than kept in the office. -->
        <p v-if="row.status === 'paid' && row.paidNote" class="mt-0.5 text-xs text-slate-500">
          {{ row.paidNote }}
        </p>
        <p v-if="row.status === 'void' && row.voidReason" class="mt-1 text-xs text-slate-500">
          {{ row.voidReason }}
        </p>
      </template>
    </BaseTable>
  </div>
</template>
