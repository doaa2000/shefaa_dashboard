<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePaymentStore, type RangePreset } from '../../store/payment.store'
import { useToast } from '@/shared/composables/useToast'
import { formatDate, formatDateTime } from '@/shared/utils/datetime'
import { titleCase } from '@/shared/utils/formatters'
import { downloadCsv, toCsv } from '@/shared/utils/csv'
import type { Payment, SettableStatus } from '../../domain/payment.models'
import MethodBreakdown from '../components/MethodBreakdown.vue'
import { BaseBadge, BaseButton, BaseSelect, BaseTable, type Column } from '@/shared/ui'

const store = usePaymentStore()
const toast = useToast()
const { range, preset, visibleItems, summary, byMethod, loading, savingId, error, statusFilter, methodFilter } =
  storeToRefs(store)

const columns: Column[] = [
  { key: 'bookedDate', label: 'Appointment' },
  { key: 'patientName', label: 'Patient' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'actions', label: '', align: 'right' },
]

const presetOptions: { label: string; value: RangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'Custom', value: 'custom' },
]

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Outstanding', value: 'pending' },
  { label: 'Collected', value: 'paid' },
  { label: 'Refunded', value: 'refunded' },
]

const methodOptions = computed(() => [
  { label: 'All methods', value: '' },
  ...byMethod.value.map((m) => ({ label: titleCase(m.method ?? '—'), value: m.method })),
])

const money = (n: number) => `EGP ${Number(n).toLocaleString()}`

const statusTone = (s: string | null) =>
  s === 'paid' ? 'success' : s === 'refunded' ? 'neutral' : s === 'failed' ? 'danger' : 'warning'

const statusLabel = (s: string | null) =>
  s === 'paid' ? 'Collected' : s === 'pending' ? 'Outstanding' : s ? titleCase(s) : '—'

/** The window the patient was asked to come in, so a disputed fee can be
 *  matched to the visit it belongs to. */
const slot = (p: Payment) =>
  p.startTime && p.endTime ? `${p.startTime.slice(0, 5)} – ${p.endTime.slice(0, 5)}` : '—'

onMounted(() => store.fetchList())
watch(range, () => store.fetchList(), { deep: true })
watch(error, (e) => {
  if (e) toast.error(e.message ?? 'Could not load payments')
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
      ? `${money(payment.amount)} marked as collected`
      : status === 'refunded'
        ? `${money(payment.amount)} marked as refunded`
        : 'Marked as outstanding',
  )
}

function exportCsv() {
  const csv = toCsv(
    ['Appointment date', 'Time', 'Patient', 'Method', 'Status', 'Amount', 'Collected at'],
    visibleItems.value.map((p) => [
      p.bookedDate,
      slot(p),
      p.patientName ?? '',
      p.method ?? '',
      p.status,
      p.amount,
      p.paidAt ?? '',
    ]),
  )
  downloadCsv(`payments-${range.value.from}-to-${range.value.to}.csv`, csv)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Payments</h1>
        <p class="text-sm text-slate-500">
          Fees for your appointments, and what has actually been collected.
        </p>
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
          Export CSV
        </BaseButton>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">Collected</p>
        <p class="mt-2 text-2xl font-semibold text-emerald-600">{{ money(summary.collected) }}</p>
      </div>
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">Outstanding</p>
        <p class="mt-2 text-2xl font-semibold text-amber-600">{{ money(summary.outstanding) }}</p>
        <p class="mt-1 text-xs text-slate-400">Cancelled appointments are not counted.</p>
      </div>
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">Paid appointments</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">
          {{ summary.paidCount }} / {{ summary.totalCount }}
        </p>
      </div>
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">Refunded</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ money(summary.refunded) }}</p>
      </div>
    </div>

    <MethodBreakdown :rows="byMethod" />

    <div class="flex flex-wrap items-center gap-2">
      <div class="w-44">
        <BaseSelect v-model="statusFilter" :options="statusOptions" />
      </div>
      <div class="w-44">
        <BaseSelect v-model="methodFilter" :options="methodOptions" />
      </div>
      <p class="text-sm text-slate-500">
        {{ visibleItems.length }} of {{ summary.totalCount }} shown
      </p>
    </div>

    <BaseTable
      :columns="columns"
      :rows="visibleItems"
      :loading="loading"
      empty-title="No payments in this range"
      empty-description="Fees appear here as soon as patients book an appointment with you."
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
            Appointment cancelled
          </p>
        </div>
      </template>
      <template #cell:method="{ row }">{{ row.method ? titleCase(row.method) : '—' }}</template>
      <template #cell:status="{ row }">
        <BaseBadge :tone="statusTone(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
        <p v-if="row.paidAt" class="mt-1 text-xs text-slate-400">
          {{ formatDateTime(row.paidAt) }}
        </p>
      </template>
      <template #cell:amount="{ row }">
        <span class="font-medium text-slate-800">{{ money(row.amount) }}</span>
      </template>
      <template #cell:actions="{ row }">
        <div class="flex justify-end gap-2">
          <BaseButton
            v-if="row.status !== 'paid'"
            size="sm"
            :loading="savingId === row.id"
            @click="mark(row, 'paid')"
          >
            Mark collected
          </BaseButton>
          <BaseButton
            v-else
            size="sm"
            variant="ghost"
            :loading="savingId === row.id"
            @click="mark(row, 'pending')"
          >
            Undo
          </BaseButton>
          <BaseButton
            v-if="row.status !== 'refunded'"
            size="sm"
            variant="outline"
            :loading="savingId === row.id"
            @click="mark(row, 'refunded')"
          >
            Refund
          </BaseButton>
        </div>
      </template>
    </BaseTable>
  </div>
</template>
