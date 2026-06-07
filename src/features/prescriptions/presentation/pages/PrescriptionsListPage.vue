<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePrescriptionStore } from '../../store/prescription.store'
import { usePagination } from '@/shared/composables/usePagination'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { pluralize } from '@/shared/utils/formatters'
import PrescriptionFormModal from '../components/PrescriptionFormModal.vue'
import type { PrescriptionFormValues } from '../../domain/prescription.schema'
import type { Prescription, PrescriptionStatus } from '../../domain/prescription.models'
import {
  BaseBadge,
  BaseButton,
  BasePagination,
  BaseTable,
  type Column,
} from '@/shared/ui'

const store = usePrescriptionStore()
const toast = useToast()
const { items, total, loading, saving } = storeToRefs(store)

const pagination = usePagination({ pageSize: 10 })
const modalOpen = ref(false)
const editing = ref<Prescription | null>(null)

const statusTone: Record<PrescriptionStatus, 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}

const columns: Column[] = [
  { key: 'issuedAt', label: 'Issued' },
  { key: 'patientName', label: 'Patient' },
  { key: 'items', label: 'Medications' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: '', align: 'right' },
]

async function load() {
  await store.fetchList({ from: pagination.range.value.from, to: pagination.range.value.to })
  pagination.setTotal(total.value)
}

onMounted(load)
watch(() => pagination.page.value, load)

function openCreate() {
  editing.value = null
  modalOpen.value = true
}
function openEdit(p: Prescription) {
  editing.value = p
  modalOpen.value = true
}

async function onSubmit(values: PrescriptionFormValues) {
  const payload = {
    patientId: values.patientId,
    consultationId: null,
    status: values.status,
    notes: values.notes ?? null,
    issuedAt: values.issuedAt,
    items: values.items.map((it) => ({
      medicationName: it.medicationName,
      dosage: it.dosage ?? null,
      frequency: it.frequency ?? null,
      duration: it.duration ?? null,
      instructions: it.instructions ?? null,
    })),
  }
  const saved = editing.value
    ? await store.update(editing.value.id, payload)
    : await store.create(payload)
  if (saved) {
    toast.success(editing.value ? 'Prescription updated' : 'Prescription issued')
    modalOpen.value = false
    await load()
  } else if (store.error) {
    toast.error('Could not save prescription', store.error.message)
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Prescriptions</h1>
        <p class="text-sm text-slate-500">Issue and manage prescriptions</p>
      </div>
      <BaseButton @click="openCreate">+ New prescription</BaseButton>
    </div>

    <BaseTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      empty-title="No prescriptions"
      empty-description="Issue your first prescription."
    >
      <template #cell:issuedAt="{ row }">{{ formatDate(row.issuedAt) }}</template>
      <template #cell:patientName="{ row }">{{ row.patientName ?? '—' }}</template>
      <template #cell:items="{ row }">{{ pluralize(row.items.length, 'medication') }}</template>
      <template #cell:status="{ row }">
        <BaseBadge :tone="statusTone[row.status]">{{ row.status }}</BaseBadge>
      </template>
      <template #cell:actions="{ row }">
        <BaseButton size="sm" variant="ghost" @click="openEdit(row)">Edit</BaseButton>
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

    <PrescriptionFormModal v-model="modalOpen" :prescription="editing" :saving="saving" @submit="onSubmit" />
  </div>
</template>
