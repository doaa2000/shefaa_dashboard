<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../../store/patient.store'
import { usePagination } from '@/shared/composables/usePagination'
import { useDebouncedSearch } from '@/shared/composables/useDebouncedSearch'
import { useToast } from '@/shared/composables/useToast'
import { calculateAge } from '@/shared/utils/datetime'
import PatientFormModal from '../components/PatientFormModal.vue'
import type { PatientFormValues } from '../../domain/patient.schema'
import {
  BaseAvatar,
  BaseBadge,
  BaseButton,
  BaseInput,
  BasePagination,
  BaseTable,
  type Column,
} from '@/shared/ui'
import type { Patient } from '../../domain/patient.models'

const router = useRouter()
const store = usePatientStore()
const toast = useToast()
const { items, total, loading, saving } = storeToRefs(store)

const pagination = usePagination({ pageSize: 10 })
const { term, debounced } = useDebouncedSearch()
const modalOpen = ref(false)

const columns: Column<Patient>[] = [
  { key: 'fullName', label: 'Patient' },
  { key: 'contact', label: 'Contact' },
  { key: 'age', label: 'Age', align: 'center' },
  { key: 'gender', label: 'Gender' },
  { key: 'status', label: 'Status', align: 'center' },
]

async function load() {
  await store.fetchList({
    search: debounced.value || undefined,
    from: pagination.range.value.from,
    to: pagination.range.value.to,
  })
  pagination.setTotal(total.value)
}

onMounted(load)
watch([() => pagination.page.value, debounced], () => {
  if (debounced.value !== term.value) pagination.reset()
  void load()
})

function openCreate() {
  modalOpen.value = true
}

async function onSubmit(values: PatientFormValues) {
  const created = await store.create({ ...values, allergies: values.allergies ?? [] })
  if (created) {
    toast.success('Patient added', created.fullName)
    modalOpen.value = false
    await load()
  } else if (store.error) {
    toast.error('Could not save patient', store.error.message)
  }
}

function openDetail(patient: Patient) {
  void router.push({ name: 'patient-detail', params: { id: patient.id } })
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Patients</h1>
        <p class="text-sm text-slate-500">Manage your patient records</p>
      </div>
      <BaseButton @click="openCreate">+ Add patient</BaseButton>
    </div>

    <div class="max-w-sm">
      <BaseInput v-model="term" placeholder="Search by name…" />
    </div>

    <BaseTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      row-clickable
      empty-title="No patients yet"
      empty-description="Add your first patient to get started."
      @row-click="openDetail"
    >
      <template #cell:fullName="{ row }">
        <div class="flex items-center gap-3">
          <BaseAvatar :name="row.fullName" size="sm" />
          <span class="font-medium text-slate-800">{{ row.fullName }}</span>
        </div>
      </template>
      <template #cell:contact="{ row }">
        <div class="text-sm">
          <p>{{ row.phone || '—' }}</p>
          <p class="text-slate-400">{{ row.email || '—' }}</p>
        </div>
      </template>
      <template #cell:age="{ row }">{{ calculateAge(row.dateOfBirth) ?? '—' }}</template>
      <template #cell:gender="{ row }">{{ row.gender }}</template>
      <template #cell:status="{ row }">
        <BaseBadge :tone="row.isActive ? 'success' : 'neutral'">
          {{ row.isActive ? 'Active' : 'Inactive' }}
        </BaseBadge>
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

    <PatientFormModal v-model="modalOpen" :saving="saving" @submit="onSubmit" />
  </div>
</template>
