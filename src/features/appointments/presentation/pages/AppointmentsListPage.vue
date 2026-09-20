<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAppointmentStore } from '../../store/appointment.store'
import { usePagination } from '@/shared/composables/usePagination'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { statusOptions, statusLabel, statusTone } from '../../domain/appointment.labels'
import { timeLabel } from '@/features/schedule/domain/schedule.models'
import AppointmentFormModal from '../components/AppointmentFormModal.vue'
import type { AppointmentFormValues } from '../../domain/appointment.schema'
import type { Appointment } from '../../domain/appointment.models'
import {
  BaseBadge,
  BaseButton,
  BaseSelect,
  BasePagination,
  BaseTable,
  FormField,
  type Column,
} from '@/shared/ui'

const store = useAppointmentStore()
const toast = useToast()
const { t } = useI18n()
const { items, total, loading, saving, error } = storeToRefs(store)

const pagination = usePagination({ pageSize: 10 })
const statusFilter = ref<string>('')

/** YYYY-MM-DD in the clinic's own day. toISOString hands back UTC, which after
 *  ten at night in Cairo is already tomorrow. */
function isoDay(date: Date): string {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

type RangePreset = 'all' | 'today' | 'week' | 'custom'

const preset = ref<RangePreset>('all')
const fromDate = ref('')
const toDate = ref('')

const presets = computed<{ label: string; value: RangePreset }[]>(() => [
  { label: t('appointments.range.all'), value: 'all' },
  { label: t('appointments.range.today'), value: 'today' },
  { label: t('appointments.range.week'), value: 'week' },
  { label: t('appointments.range.custom'), value: 'custom' },
])

/**
 * The presets look forward, not back. A doctor opening this page is asking
 * who is coming, and "last 7 days" answers a question they did not ask -- the
 * payments page is where the past lives.
 */
function applyPreset(next: RangePreset) {
  preset.value = next
  const today = new Date()

  if (next === 'all') {
    fromDate.value = ''
    toDate.value = ''
  } else if (next === 'today') {
    fromDate.value = isoDay(today)
    toDate.value = isoDay(today)
  } else if (next === 'week') {
    const end = new Date(today)
    end.setDate(end.getDate() + 6)
    fromDate.value = isoDay(today)
    toDate.value = isoDay(end)
  }
}

/** Typing a date by hand is a custom range, whatever the preset said before. */
function setFrom(value: string) {
  fromDate.value = value
  preset.value = 'custom'
}

function setTo(value: string) {
  toDate.value = value
  preset.value = 'custom'
}
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

/**
 * The filter, read back as a sentence.
 *
 * Four controls describe what can be chosen and none of them says what is
 * currently being shown -- which is the only question the doctor actually has
 * when a table looks shorter than they expected.
 */
const showing = computed(() => {
  if (!fromDate.value && !toDate.value) return t('appointments.showingAll', { count: total.value })
  if (fromDate.value && toDate.value && fromDate.value === toDate.value) {
    return t('appointments.showingDay', { count: total.value, date: formatDate(fromDate.value) })
  }
  if (fromDate.value && toDate.value) {
    return t('appointments.showingRange', {
      count: total.value,
      from: formatDate(fromDate.value),
      to: formatDate(toDate.value),
    })
  }
  if (fromDate.value) {
    return t('appointments.showingFrom', { count: total.value, date: formatDate(fromDate.value) })
  }
  return t('appointments.showingUntil', { count: total.value, date: formatDate(toDate.value) })
})

/** How long the appointment runs, so "9:00 – 9:20" does not have to be
 *  subtracted in the reader's head while they scan a column of them. */
function lengthOf(a: Appointment): number {
  const [sh, sm] = (a.startTime ?? '00:00').split(':').map(Number)
  const [eh, em] = (a.endTime ?? '00:00').split(':').map(Number)
  return Math.max(eh * 60 + em - (sh * 60 + sm), 0)
}

async function load() {
  await store.fetchList({
    status: statusFilter.value || undefined,
    fromDate: fromDate.value || undefined,
    toDate: toDate.value || undefined,
    from: pagination.range.value.from,
    to: pagination.range.value.to,
  })
  pagination.setTotal(total.value)
}

onMounted(load)
watch([() => pagination.page.value], load)

// Back to the first page whenever the filter changes. Staying on page three of
// a list that just became four rows long shows an empty table, which reads as
// "no appointments" rather than "you are past the end".
watch([statusFilter, fromDate, toDate], () => {
  if (pagination.page.value !== 1) {
    pagination.reset()
    return
  }
  load()
})

// Bookings are made in the patients' app, and only there. The dashboard shows
// them and manages them -- it does not write new ones, so there is no create
// path here and none behind it either.
function openEdit(a: Appointment) {
  editing.value = a
  modalOpen.value = true
}

async function onSubmit(values: AppointmentFormValues) {
  if (!editing.value) return
  const saved = await store.update(editing.value.id, values)
  if (saved) {
    toast.success(t('appointments.updated'))
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
    </div>

    <!-- Every control labelled. Two bare date boxes with a dash between them
         leave the reader to work out which end is which, and the dash is the
         only hint that they are one thing rather than two. -->
    <div class="flex flex-wrap items-end gap-3">
      <FormField :label="t('appointments.filterStatus')" class="w-44">
        <BaseSelect
          v-model="statusFilter"
          :options="[{ label: t('appointments.allStatuses'), value: '' }, ...statuses]"
          :placeholder="undefined"
        />
      </FormField>

      <FormField :label="t('appointments.filterPeriod')" class="w-40">
        <BaseSelect
          :model-value="preset"
          :options="presets"
          :placeholder="undefined"
          @update:model-value="applyPreset"
        />
      </FormField>

      <FormField :label="t('appointments.filterFrom')">
        <input
          type="date"
          class="h-10 rounded-xl border border-surface-border bg-white px-3 text-sm text-slate-800"
          :value="fromDate"
          :max="toDate || undefined"
          @change="setFrom(($event.target as HTMLInputElement).value)"
        />
      </FormField>

      <FormField :label="t('appointments.filterTo')">
        <input
          type="date"
          class="h-10 rounded-xl border border-surface-border bg-white px-3 text-sm text-slate-800"
          :value="toDate"
          :min="fromDate || undefined"
          @change="setTo(($event.target as HTMLInputElement).value)"
        />
      </FormField>

      <BaseButton
        v-if="fromDate || toDate"
        variant="ghost"
        size="sm"
        @click="applyPreset('all')"
      >
        {{ t('appointments.range.clear') }}
      </BaseButton>
    </div>

    <!-- What the filter currently means, in a sentence. The controls say what
         can be chosen; this says what is being shown. -->
    <p class="text-sm text-slate-500">{{ showing }}</p>

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
      <template #cell:time="{ row }">
        <p class="font-medium text-slate-800">
          {{ timeLabel(row.startTime?.slice(0, 5) ?? '') }} –
          {{ timeLabel(row.endTime?.slice(0, 5) ?? '') }}
        </p>
        <p class="text-xs text-slate-500">
          {{ t('appointments.lasts', { minutes: lengthOf(row) }) }}
        </p>
      </template>
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
