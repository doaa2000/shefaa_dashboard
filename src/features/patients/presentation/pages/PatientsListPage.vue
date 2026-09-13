<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../../store/patient.store'
import { useDebouncedSearch } from '@/shared/composables/useDebouncedSearch'
import { calculateAge } from '@/shared/utils/datetime'
import { labelFor } from '@/shared/utils/formatters'
import { BaseAvatar, BaseInput, BaseTable, type Column } from '@/shared/ui'
import type { Patient } from '../../domain/patient.models'

const router = useRouter()
const store = usePatientStore()
const { t } = useI18n()
const { items, loading } = storeToRefs(store)
const { term, debounced } = useDebouncedSearch()

const columns = computed<Column[]>(() => [
  { key: 'name', label: t('patients.columns.patient') },
  { key: 'phone', label: t('patients.columns.phone') },
  { key: 'age', label: t('patients.columns.age'), align: 'center' },
  { key: 'gender', label: t('patients.columns.gender') },
])

onMounted(() => store.fetchList())
watch(debounced, (value) => store.fetchList(value || undefined))

function openDetail(patient: Patient) {
  void router.push({ name: 'patient-detail', params: { id: patient.id } })
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">{{ t('patients.title') }}</h1>
      <p class="text-sm text-slate-500">{{ t('patients.subtitle') }}</p>
    </div>

    <div class="max-w-sm">
      <BaseInput v-model="term" :placeholder="t('patients.searchPlaceholder')" />
    </div>

    <BaseTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      row-clickable
      :empty-title="t('patients.emptyTitle')"
      :empty-description="t('patients.emptyBody')"
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
      <template #cell:gender="{ row }">{{ labelFor('gender', row.gender) }}</template>
    </BaseTable>
  </div>
</template>
