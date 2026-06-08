<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../../store/patient.store'
import { useDebouncedSearch } from '@/shared/composables/useDebouncedSearch'
import { calculateAge } from '@/shared/utils/datetime'
import { titleCase } from '@/shared/utils/formatters'
import { BaseAvatar, BaseInput, BaseTable, type Column } from '@/shared/ui'
import type { Patient } from '../../domain/patient.models'

const router = useRouter()
const store = usePatientStore()
const { items, loading } = storeToRefs(store)
const { term, debounced } = useDebouncedSearch()

const columns: Column[] = [
  { key: 'name', label: 'Patient' },
  { key: 'phone', label: 'Phone' },
  { key: 'age', label: 'Age', align: 'center' },
  { key: 'gender', label: 'Gender' },
]

onMounted(() => store.fetchList())
watch(debounced, (value) => store.fetchList(value || undefined))

function openDetail(patient: Patient) {
  void router.push({ name: 'patient-detail', params: { id: patient.id } })
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">Patients</h1>
      <p class="text-sm text-slate-500">Patients who have booked with you</p>
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
      empty-description="Patients appear here once they book an appointment with you."
      @row-click="openDetail"
    >
      <template #cell:name="{ row }">
        <div class="flex items-center gap-3">
          <BaseAvatar :name="row.name" size="sm" />
          <span class="font-medium text-slate-800">{{ row.name }}</span>
        </div>
      </template>
      <template #cell:phone="{ row }">{{ row.phone || '—' }}</template>
      <template #cell:age="{ row }">{{ calculateAge(row.birthDate) ?? '—' }}</template>
      <template #cell:gender="{ row }">{{ row.gender ? titleCase(row.gender) : '—' }}</template>
    </BaseTable>
  </div>
</template>
