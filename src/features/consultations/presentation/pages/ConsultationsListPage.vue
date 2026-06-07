<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useConsultationStore } from '../../store/consultation.store'
import { usePagination } from '@/shared/composables/usePagination'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { truncate } from '@/shared/utils/formatters'
import ConsultationFormModal from '../components/ConsultationFormModal.vue'
import type { ConsultationFormValues } from '../../domain/consultation.schema'
import type { Consultation } from '../../domain/consultation.models'
import {
  BaseBadge,
  BaseButton,
  BasePagination,
  BaseTable,
  type Column,
} from '@/shared/ui'

const store = useConsultationStore()
const toast = useToast()
const { items, total, loading, saving } = storeToRefs(store)

const pagination = usePagination({ pageSize: 10 })
const modalOpen = ref(false)
const editing = ref<Consultation | null>(null)

const columns: Column<Consultation>[] = [
  { key: 'consultedAt', label: 'Date' },
  { key: 'patientName', label: 'Patient' },
  { key: 'diagnosis', label: 'Diagnosis' },
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
function openEdit(c: Consultation) {
  editing.value = c
  modalOpen.value = true
}

async function onSubmit(values: ConsultationFormValues) {
  const payload = {
    patientId: values.patientId,
    appointmentId: null,
    chiefComplaint: values.chiefComplaint ?? null,
    diagnosis: values.diagnosis ?? null,
    symptoms: values.symptoms ?? [],
    clinicalNotes: values.clinicalNotes ?? null,
    vitals: values.vitals ?? {},
    status: values.status,
    consultedAt: values.consultedAt,
  }
  const saved = editing.value
    ? await store.update(editing.value.id, payload)
    : await store.create(payload)
  if (saved) {
    toast.success(editing.value ? 'Consultation updated' : 'Consultation recorded')
    modalOpen.value = false
    await load()
  } else if (store.error) {
    toast.error('Could not save consultation', store.error.message)
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Consultations</h1>
        <p class="text-sm text-slate-500">Clinical encounter records</p>
      </div>
      <BaseButton @click="openCreate">+ New consultation</BaseButton>
    </div>

    <BaseTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      empty-title="No consultations"
      empty-description="Record your first consultation."
    >
      <template #cell:consultedAt="{ row }">{{ formatDate(row.consultedAt) }}</template>
      <template #cell:patientName="{ row }">{{ row.patientName ?? '—' }}</template>
      <template #cell:diagnosis="{ row }">{{ row.diagnosis ? truncate(row.diagnosis, 50) : '—' }}</template>
      <template #cell:status="{ row }">
        <BaseBadge :tone="row.status === 'finalized' ? 'success' : 'warning'">
          {{ row.status === 'finalized' ? 'Finalized' : 'Draft' }}
        </BaseBadge>
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

    <ConsultationFormModal v-model="modalOpen" :consultation="editing" :saving="saving" @submit="onSubmit" />
  </div>
</template>
