<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../../store/patient.store'
import { calculateAge, formatDate } from '@/shared/utils/datetime'
import { formatMoney, labelFor } from '@/shared/utils/formatters'
import { statusLabel, statusTone } from '@/features/appointments/domain/appointment.labels'
import { BaseAvatar, BaseBadge, BaseCard, BaseEmptyState, BaseSkeleton, BaseSpinner, BaseTable, type Column } from '@/shared/ui'

const route = useRoute()
const store = usePatientStore()
const { t } = useI18n()
const { current, history, loading, historyLoading } = storeToRefs(store)

const patientId = route.params.id as string
onMounted(() => {
  void store.fetchOne(patientId)
  void store.fetchHistory(patientId)
})

const visitColumns = computed<Column[]>(() => [
  { key: 'bookedDate', label: t('patients.visitColumns.date') },
  { key: 'time', label: t('patients.visitColumns.time') },
  { key: 'status', label: t('patients.visitColumns.status'), align: 'center' },
  { key: 'amount', label: t('patients.visitColumns.fee'), align: 'right' },
  { key: 'paymentStatus', label: t('patients.visitColumns.payment'), align: 'center' },
])

/** The window the patient was asked to arrive in, which is what they were told. */
const slot = (from: string, to: string) =>
  from && to ? `${from.slice(0, 5)} – ${to.slice(0, 5)}` : '—'

const stats = computed(() => {
  const s = history.value?.summary
  if (!s) return []
  return [
    { key: 'visits', label: t('patients.visits'), value: String(s.visits) },
    { key: 'attended', label: t('patients.attended'), value: String(s.attended) },
    { key: 'noShow', label: t('patients.noShow'), value: String(s.noShow) },
    { key: 'fees', label: t('patients.totalFees'), value: formatMoney(s.fees) },
  ]
})
</script>

<template>
  <div class="space-y-5">
    <RouterLink to="/patients" class="text-sm text-primary-600 hover:underline">{{ t('patients.back') }}</RouterLink>

    <div v-if="loading" class="py-16 text-center"><BaseSpinner size="lg" :label="t('common.loading')" /></div>

    <template v-else-if="current">
      <div class="flex items-center gap-4">
        <BaseAvatar :name="current.name" size="lg" />
        <div>
          <h1 class="text-xl font-semibold text-slate-900">{{ current.name }}</h1>
          <p class="text-sm text-slate-500">
            {{ labelFor('gender', current.gender) }} ·
            {{ t('patients.years', { count: calculateAge(current.birthDate) ?? '—' }) }}
          </p>
        </div>
      </div>

      <BaseCard :title="t('patients.contact')">
        <dl class="grid grid-cols-2 gap-y-3 text-sm">
          <dt class="text-slate-500">{{ t('patients.columns.phone') }}</dt>
          <dd class="text-slate-800">{{ current.phone || '—' }}</dd>
          <dt class="text-slate-500">{{ t('patients.birthDate') }}</dt>
          <dd class="text-slate-800">{{ formatDate(current.birthDate) }}</dd>
          <dt class="text-slate-500">{{ t('patients.columns.gender') }}</dt>
          <dd class="text-slate-800">{{ labelFor('gender', current.gender) }}</dd>
        </dl>
      </BaseCard>

      <!-- What the doctor opened the page for. The contact card above answers
           "how do I reach them"; this answers "who is this, to me". -->
      <BaseCard :title="t('patients.history')" :subtitle="t('patients.historyNote')">
        <BaseSkeleton v-if="historyLoading && !history" :rows="3" />

        <template v-else-if="history">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div v-for="stat in stats" :key="stat.key" class="rounded-xl bg-surface-muted p-4">
              <p class="text-xs text-slate-500">{{ stat.label }}</p>
              <p class="mt-1 text-lg font-semibold text-slate-900">{{ stat.value }}</p>
            </div>
          </div>

          <p v-if="history.summary.lastVisit" class="mt-3 text-sm text-slate-500">
            {{ t('patients.firstVisit') }}: {{ formatDate(history.summary.firstVisit) }} ·
            {{ t('patients.lastVisit') }}: {{ formatDate(history.summary.lastVisit) }}
          </p>

          <BaseEmptyState
            v-if="history.items.length === 0"
            :title="t('patients.noVisitsTitle')"
            :description="t('patients.noVisitsBody')"
          />

          <div v-else class="mt-4">
            <BaseTable :columns="visitColumns" :rows="history.items">
              <template #cell:bookedDate="{ row }">
                <span class="font-medium text-slate-800">{{ formatDate(row.bookedDate) }}</span>
              </template>
              <template #cell:time="{ row }">{{ slot(row.startTime, row.endTime) }}</template>
              <template #cell:status="{ row }">
                <BaseBadge :tone="statusTone(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
              </template>
              <template #cell:amount="{ row }">
                {{ row.amount == null ? '—' : formatMoney(row.amount) }}
              </template>
              <template #cell:paymentStatus="{ row }">
                {{ labelFor('paymentStatus', row.paymentStatus) }}
              </template>
            </BaseTable>
          </div>
        </template>
      </BaseCard>
    </template>
  </div>
</template>
