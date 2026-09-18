<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { usePaymentStore, type RangePreset } from '../../store/payment.store'
import { useInvoiceStore } from '@/features/invoices/store/invoice.store'
import { coversWholeMonth } from '@/features/invoices/domain/invoice.models'
import { intlLocale } from '@/app/i18n'
import { useToast } from '@/shared/composables/useToast'
import { formatDate, formatDateTime } from '@/shared/utils/datetime'
import { formatMoney, labelFor } from '@/shared/utils/formatters'
import { downloadCsv, toCsv } from '@/shared/utils/csv'
import type { Payment, SettableStatus } from '../../domain/payment.models'
import { BaseBadge, BaseButton, BaseSelect, BaseTable, type Column } from '@/shared/ui'

const store = usePaymentStore()
const invoices = useInvoiceStore()
const toast = useToast()
const { t } = useI18n()
const { latestOutstanding, outstandingTotal } = storeToRefs(invoices)
const { range, preset, visibleItems, summary, byMethod, loading, savingId, error, statusFilter, methodFilter } =
  storeToRefs(store)

// Five columns, not seven. The payment method belongs under the status it
// describes, and the platform's share under the fee it is a share of; as
// columns of their own they were two more things to read across.
const columns = computed<Column[]>(() => [
  { key: 'bookedDate', label: t('payments.columns.appointment') },
  { key: 'patientName', label: t('payments.columns.patient') },
  { key: 'status', label: t('payments.columns.status'), align: 'center' },
  { key: 'amount', label: t('payments.columns.amount'), align: 'right' },
  { key: 'actions', label: '', align: 'right' },
])

const presetOptions = computed<{ label: string; value: RangePreset }[]>(() => [
  { label: t('payments.range.today'), value: 'today' },
  { label: t('payments.range.week'), value: 'week' },
  { label: t('payments.range.month'), value: 'month' },
  { label: t('payments.range.custom'), value: 'custom' },
])

const statusOptions = computed(() => [
  { label: t('payments.allStatuses'), value: '' },
  { label: t('paymentStatus.pending'), value: 'pending' },
  { label: t('paymentStatus.paid'), value: 'paid' },
  { label: t('paymentStatus.refunded'), value: 'refunded' },
])

const methodOptions = computed(() => [
  { label: t('payments.allMethods'), value: '' },
  ...byMethod.value.map((m) => ({ label: labelFor('method', m.method), value: m.method })),
])

const money = (n: number) => formatMoney(n)

/** Cash is in the drawer and instapay is in the bank, so the two are still
 *  counted apart -- but as one line under the figure they split, not as a
 *  second block of cards restating it. */
const methodLine = computed(() =>
  byMethod.value
    .filter((m) => m.collected > 0)
    .map((m) => `${labelFor('method', m.method)} ${money(m.collected)}`)
    .join(' · '),
)

const unpaidCount = computed(() => summary.value.totalCount - summary.value.paidCount)

const statusTone = (s: string | null) =>
  s === 'paid' ? 'success' : s === 'refunded' ? 'neutral' : s === 'failed' ? 'danger' : 'warning'

const statusLabel = (s: string | null) => labelFor('paymentStatus', s)

/** The window the patient was asked to come in, so a disputed fee can be
 *  matched to the visit it belongs to. */
const slot = (p: Payment) =>
  p.startTime && p.endTime ? `${p.startTime.slice(0, 5)} – ${p.endTime.slice(0, 5)}` : '—'

onMounted(() => {
  store.fetchList()
  // The commission figure above is a running total; this tells the doctor
  // which part of it has actually been billed, and whether it is still owed.
  invoices.ensureLoaded()
})

/** Named the way the invoices page names it, so the two agree on sight. */
const dueLabel = computed(() => {
  const invoice = latestOutstanding.value
  if (!invoice) return ''
  return coversWholeMonth(invoice.periodStart, invoice.periodEnd)
    ? new Intl.DateTimeFormat(intlLocale(), { month: 'long', year: 'numeric' }).format(
        new Date(`${invoice.periodStart}T00:00:00`),
      )
    : `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`
})
watch(range, () => store.fetchList(), { deep: true })
watch(error, (e) => {
  if (e) toast.error(e.message ?? t('payments.toast.loadFailed'))
})

function onPreset(next: RangePreset) {
  store.setPreset(next)
  if (next === 'custom') return
  // setPreset already moved the range, and the watcher above reloads.
}

function onFrom(value: string) {
  if (value) store.setRange({ from: value, to: range.value.to })
}
function onTo(value: string) {
  if (value) store.setRange({ from: range.value.from, to: value })
}

async function mark(payment: Payment, status: SettableStatus) {
  const done = await store.setStatus(payment.id, status)
  if (!done) return
  toast.success(
    status === 'paid'
      ? t('payments.toast.markedCollected', { amount: money(payment.amount) })
      : status === 'refunded'
        ? t('payments.toast.markedRefunded', { amount: money(payment.amount) })
        : t('payments.toast.markedOutstanding'),
  )
}

function exportCsv() {
  const csv = toCsv(
    [
      t('payments.csv.date'),
      t('payments.csv.time'),
      t('payments.csv.patient'),
      t('payments.csv.method'),
      t('payments.csv.status'),
      t('payments.csv.amount'),
      t('payments.csv.collectedAt'),
      t('payments.commissionColumn'),
    ],
    visibleItems.value.map((p) => [
      p.bookedDate,
      slot(p),
      p.patientName ?? '',
      labelFor('method', p.method),
      statusLabel(p.status),
      p.amount,
      p.paidAt ?? '',
      p.commissionAmount ?? '',
    ]),
  )
  downloadCsv(`payments-${range.value.from}-to-${range.value.to}.csv`, csv)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">{{ t('payments.title') }}</h1>
        <p class="text-sm text-slate-500">{{ t('payments.subtitle') }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="w-40">
          <BaseSelect
            :model-value="preset"
            :options="presetOptions"
            @update:model-value="onPreset"
          />
        </div>
        <input
          type="date"
          class="h-10 rounded-xl border border-surface-border bg-white px-3 text-sm text-slate-800"
          :value="range.from"
          :max="range.to"
          @change="onFrom(($event.target as HTMLInputElement).value)"
        />
        <span class="text-sm text-slate-400">–</span>
        <input
          type="date"
          class="h-10 rounded-xl border border-surface-border bg-white px-3 text-sm text-slate-800"
          :value="range.to"
          :min="range.from"
          @change="onTo(($event.target as HTMLInputElement).value)"
        />
        <BaseButton variant="outline" :disabled="!visibleItems.length" @click="exportCsv">
          {{ t('common.exportCsv') }}
        </BaseButton>
      </div>
    </div>

    <!-- Three questions, in the order a doctor asks them: what came in, what
         has not, and what is mine. Every other figure that used to sit up here
         was one of these three said a second way. -->
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">{{ t('payments.collected') }}</p>
        <p class="mt-2 text-2xl font-semibold text-emerald-600">{{ money(summary.collected) }}</p>
        <p v-if="methodLine" class="mt-1 text-xs text-slate-400">{{ methodLine }}</p>
        <p v-if="summary.refunded > 0" class="mt-1 text-xs text-slate-400">
          {{ t('payments.refundedLine', { amount: money(summary.refunded) }) }}
        </p>
      </div>

      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">{{ t('payments.outstanding') }}</p>
        <p class="mt-2 text-2xl font-semibold text-amber-600">{{ money(summary.outstanding) }}</p>
        <p class="mt-1 text-xs text-slate-400">
          {{ t('payments.outstandingCount', { count: unpaidCount, total: summary.totalCount }) }}
        </p>
      </div>

      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">{{ t('payments.net') }}</p>
        <p class="mt-2 text-2xl font-semibold text-primary-900">{{ money(summary.net) }}</p>
        <p class="mt-1 text-xs text-slate-400">
          {{ t('payments.netNote', { amount: money(summary.commission) }) }}
        </p>
        <p v-if="summary.unrated > 0" class="mt-1 text-xs text-slate-400">
          {{ t('payments.unratedNote', { count: summary.unrated }) }}
        </p>
      </div>
    </div>

    <!-- What of that share has actually been billed. A running total with no
         bill behind it leaves the doctor guessing when, and how much, to pay. -->
    <RouterLink
      v-if="latestOutstanding"
      to="/invoices"
      class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100"
    >
      <p class="text-sm font-medium text-amber-800">
        {{
          t('payments.invoiceDue', {
            period: dueLabel,
            amount: money(latestOutstanding.commission),
          })
        }}
      </p>
      <span class="text-sm font-medium text-amber-900 underline">
        {{
          outstandingTotal > latestOutstanding.commission
            ? t('payments.invoiceDueMore', { amount: money(outstandingTotal) })
            : t('payments.invoiceView')
        }}
      </span>
    </RouterLink>

    <div class="flex flex-wrap items-center gap-2">
      <div class="w-44">
        <BaseSelect v-model="statusFilter" :options="statusOptions" />
      </div>
      <div class="w-44">
        <BaseSelect v-model="methodFilter" :options="methodOptions" />
      </div>
      <p class="text-sm text-slate-500">
        {{ t('payments.shown', { shown: visibleItems.length, total: summary.totalCount }) }}
      </p>
    </div>

    <BaseTable
      :columns="columns"
      :rows="visibleItems"
      :loading="loading"
      :empty-title="t('payments.emptyTitle')"
      :empty-description="t('payments.emptyBody')"
    >
      <template #cell:bookedDate="{ row }">
        <div>
          <p class="font-medium text-slate-800">{{ formatDate(row.bookedDate) }}</p>
          <p class="text-xs text-slate-500">{{ slot(row) }}</p>
        </div>
      </template>
      <template #cell:patientName="{ row }">
        <div>
          <p>{{ row.patientName ?? '—' }}</p>
          <p v-if="row.bookingStatus === 'cancelled'" class="text-xs text-slate-400">
            {{ t('payments.appointmentCancelled') }}
          </p>
        </div>
      </template>
      <template #cell:status="{ row }">
        <BaseBadge :tone="statusTone(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
        <p class="mt-1 text-xs text-slate-500">{{ labelFor('method', row.method) }}</p>
        <p v-if="row.paidAt" class="text-xs text-slate-400">
          {{ formatDateTime(row.paidAt) }}
        </p>
      </template>
      <template #cell:amount="{ row }">
        <p class="font-medium text-slate-800">{{ money(row.amount) }}</p>
        <p v-if="row.commissionAmount != null" class="text-xs text-slate-400">
          {{ t('payments.commissionLine', { amount: money(row.commissionAmount) }) }}
        </p>
      </template>
      <template #cell:actions="{ row }">
        <!-- One button on the row that needs one. Refunding is only a thing
             you do to money you took, so it waits until the fee is collected
             rather than sitting on every row as a third choice. -->
        <div class="flex justify-end gap-2">
          <BaseButton
            v-if="row.status !== 'paid'"
            size="sm"
            :loading="savingId === row.id"
            @click="mark(row, 'paid')"
          >
            {{ t('payments.markCollected') }}
          </BaseButton>
          <template v-else>
            <BaseButton
              size="sm"
              variant="ghost"
              :loading="savingId === row.id"
              @click="mark(row, 'pending')"
            >
              {{ t('payments.undo') }}
            </BaseButton>
            <BaseButton
              size="sm"
              variant="outline"
              :loading="savingId === row.id"
              @click="mark(row, 'refunded')"
            >
              {{ t('payments.refund') }}
            </BaseButton>
          </template>
        </div>
      </template>
    </BaseTable>
  </div>
</template>
