<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePaymentStore } from '../../store/payment.store'
import { formatDate, formatDateTime } from '@/shared/utils/datetime'
import { titleCase } from '@/shared/utils/formatters'
import { BaseBadge, BaseTable, type Column } from '@/shared/ui'

const store = usePaymentStore()
const { items, totalAmount, loading } = storeToRefs(store)

const columns: Column[] = [
  { key: 'createdAt', label: 'Date' },
  { key: 'patientName', label: 'Patient' },
  { key: 'bookedDate', label: 'Appointment' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'amount', label: 'Amount', align: 'right' },
]

const statusTone = (s: string | null) =>
  s === 'paid' || s === 'completed' ? 'success' : s === 'failed' ? 'danger' : 'warning'

onMounted(() => store.fetchList())
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Payments</h1>
        <p class="text-sm text-slate-500">Payments from your appointments</p>
      </div>
      <div class="rounded-2xl border border-surface-border bg-white px-5 py-3 text-right shadow-card">
        <p class="text-xs text-slate-500">Total collected</p>
        <p class="text-lg font-semibold text-slate-900">EGP {{ totalAmount.toLocaleString() }}</p>
      </div>
    </div>

    <BaseTable :columns="columns" :rows="items" :loading="loading" empty-title="No payments" empty-description="Payments appear here once patients pay for bookings.">
      <template #cell:createdAt="{ row }">{{ row.createdAt ? formatDateTime(row.createdAt) : '—' }}</template>
      <template #cell:patientName="{ row }">{{ row.patientName ?? '—' }}</template>
      <template #cell:bookedDate="{ row }">{{ formatDate(row.bookedDate) }}</template>
      <template #cell:method="{ row }">{{ row.method ? titleCase(row.method) : '—' }}</template>
      <template #cell:status="{ row }">
        <BaseBadge :tone="statusTone(row.status)">{{ row.status ? titleCase(row.status) : '—' }}</BaseBadge>
      </template>
      <template #cell:amount="{ row }">
        <span class="font-medium text-slate-800">EGP {{ row.amount.toLocaleString() }}</span>
      </template>
    </BaseTable>
  </div>
</template>
