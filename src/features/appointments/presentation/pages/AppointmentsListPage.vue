<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAppointmentStore } from '../../store/appointment.store'
import { usePagination } from '@/shared/composables/usePagination'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { statusOptions, statusLabel, statusTone } from '../../domain/appointment.labels'
import AppointmentFormModal from '../components/AppointmentFormModal.vue'
import type { AppointmentFormValues } from '../../domain/appointment.schema'
import type { Appointment } from '../../domain/appointment.models'
import { BaseBadge, BaseButton, BaseSelect, BasePagination, BaseTable, type Column } from '@/shared/ui'

const store = useAppointmentStore()
const toast = useToast()
const { t } = useI18n()
const { items, total, loading, saving, error } = storeToRefs(store)

const pagination = usePagination({ pageSize: 10 })
const statusFilter = ref<string>('')
const modalOpen = ref(false)
const editing = ref<Appointment | null>(null)

const columns = computed<Column[]>(() => [
  { key: 'bookedDate', label: t('appointments.columns.date') },
  { key: 'time', label: t('appointments.columns.time') },
  { key: 'patientName', label: t('appointments.columns.patient') },
  { key: 'status', label: t('appointments.columns.status'), align: 'center' },
  { key: 'actions', label: '', align: 'right' },
])

const statuses = computed(() => statusOptions())

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
    : await store.create({
        ...values,
        // '' means "use the doctor's standing fee", and the database reads
        // that as the argument being absent.
        amount: values.amount === '' || values.amount === undefined ? null : values.amount,
        paymentMethod: values.paymentMethod,
        paid: values.paid,
      })
  if (saved) {
    toast.success(t(editing.value ? 'appointments.updated' : 'appointments.created'))
    modalOpen.value = false
    await load()
  } else if (store.error) {
    toast.error(t('appointments.saveFailed'), store.error.message)
  }
}

async function changeStatus(a: Appointment, status: string) {
  if (await store.setStatus(a.id, status)) toast.success(t('appointments.statusUpdated'), statusLabel(status))
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">{{ t('appointments.title') }}</h1>
        <p class="text-sm text-slate-500">{{ t('appointments.subtitle') }}</p>
      </div>
      <BaseButton @click="openCreate">{{ t('appointments.newAppointment') }}</BaseButton>
    </div>

    <div class="max-w-xs">
      <BaseSelect
        v-model="statusFilter"
        :options="[{ label: t('appointments.allStatuses'), value: '' }, ...statuses]"
        :placeholder="undefined"
      />
    </div>

    <!-- An account with no doctor behind it has no appointments to list. The
         table would just say "No appointments", which reads as a bug. -->
    <BaseTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      :empty-title="t('appointments.emptyTitle')"
      :empty-description="error?.message ?? t('appointments.emptyBody')"
    >
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
            <option v-for="o in statuses" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <BaseButton size="sm" variant="ghost" @click="openEdit(row)">{{ t('common.edit') }}</BaseButton>
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
