<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppointmentStore } from '../../store/appointment.store'
import { usePagination } from '@/shared/composables/usePagination'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { STATUS_OPTIONS, statusLabel, statusTone } from '../../domain/appointment.labels'
import AppointmentFormModal from '../components/AppointmentFormModal.vue'
import type { AppointmentFormValues } from '../../domain/appointment.schema'
import type { Appointment } from '../../domain/appointment.models'
import { BaseBadge, BaseButton, BaseSelect, BasePagination, BaseTable, type Column } from '@/shared/ui'

const store = useAppointmentStore()
const toast = useToast()
const { items, total, loading, saving } = storeToRefs(store)

const pagination = usePagination({ pageSize: 10 })
const statusFilter = ref<string>('')
const modalOpen = ref(false)
const editing = ref<Appointment | null>(null)

const columns: Column[] = [
  { key: 'bookedDate', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'patientName', label: 'Patient' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

async function load() {
  await store.fetchList({
    status: statusFilter.value || undefined,
    from: pagination.range.value.from,
    to: pagination.range.value.to,
  })
  pagination.setTotal(total.value)
}

onMounted(load)
watch([() => pagination.page.value, statusFilter], load)

function openCreate() {
  editing.value = null
  modalOpen.value = true
}
function openEdit(a: Appointment) {
  editing.value = a
  modalOpen.value = true
}

async function onSubmit(values: AppointmentFormValues) {
  const saved = editing.value
    ? await store.update(editing.value.id, values)
    : await store.create(values)
  if (saved) {
    toast.success(editing.value ? 'Appointment updated' : 'Appointment created')
    modalOpen.value = false
    await load()
  } else if (store.error) {
    toast.error('Could not save appointment', store.error.message)
  }
}

async function changeStatus(a: Appointment, status: string) {
  if (await store.setStatus(a.id, status)) toast.success('Status updated', statusLabel(status))
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Appointments</h1>
        <p class="text-sm text-slate-500">Your bookings</p>
      </div>
      <BaseButton @click="openCreate">+ New appointment</BaseButton>
    </div>

    <div class="max-w-xs">
      <BaseSelect
        v-model="statusFilter"
        :options="[{ label: 'All statuses', value: '' }, ...STATUS_OPTIONS]"
        :placeholder="undefined"
      />
    </div>

    <BaseTable :columns="columns" :rows="items" :loading="loading" empty-title="No appointments" empty-description="Create your first booking.">
      <template #cell:bookedDate="{ row }">
        <span class="font-medium text-slate-800">{{ formatDate(row.bookedDate) }}</span>
      </template>
      <template #cell:time="{ row }">{{ row.startTime?.slice(0, 5) }} – {{ row.endTime?.slice(0, 5) }}</template>
      <template #cell:patientName="{ row }">{{ row.patientName ?? '—' }}</template>
      <template #cell:status="{ row }">
        <BaseBadge :tone="statusTone(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
      </template>
      <template #cell:actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <select
            class="rounded-lg border border-surface-border px-2 py-1 text-xs text-slate-600"
            :value="row.status"
            @change="changeStatus(row, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <BaseButton size="sm" variant="ghost" @click="openEdit(row)">Edit</BaseButton>
        </div>
      </template>
    </BaseTable>

    <BasePagination
      :page="pagination.page.value"
      :total-pages="pagination.totalPages.value"
      :total="total"
      :has-prev="pagination.hasPrev.value"
      :has-next="pagination.hasNext.value"
      @prev="pagination.prev"
      @next="pagination.next"
    />

    <AppointmentFormModal v-model="modalOpen" :appointment="editing" :saving="saving" @submit="onSubmit" />
  </div>
</template>
