<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useScheduleStore } from '../../store/schedule.store'
import { scheduleSchema, type ScheduleFormValues } from '../../domain/schedule.schema'
import {
  sessionOptions,
  weekdayOptions,
  WHOLE_SESSION,
  minutesPerPatient,
  slotLabel,
  timeLabel,
  windowCount,
  type ScheduleEntry,
} from '../../domain/schedule.models'
import { useToast } from '@/shared/composables/useToast'
import { labelFor } from '@/shared/utils/formatters'
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseTimePicker,
  BaseBadge,
  FormField,
  BaseEmptyState,
} from '@/shared/ui'

const store = useScheduleStore()
const toast = useToast()
const { t } = useI18n()

const weekdays = computed(() => weekdayOptions())
const sessions = computed(() => sessionOptions())
const { byWeekday, items, loading, saving, totalWeeklyCapacity } = storeToRefs(store)

const DEFAULTS: Partial<ScheduleFormValues> = {
  weekday: 0,
  session: 'morning',
  startTime: '09:00',
  endTime: '13:00',
  capacity: 16,
  slotMinutes: WHOLE_SESSION,
  isActive: true,
}

const { defineField, handleSubmit, errors, resetForm } = useForm<ScheduleFormValues>({
  // A computed schema, so the messages follow a language change instead of
  // staying in whichever one the form was opened in.
  validationSchema: computed(() => toTypedSchema(scheduleSchema())),
  initialValues: DEFAULTS,
})

const [weekday] = defineField('weekday')
const [session] = defineField('session')
const [startTime] = defineField('startTime')
const [endTime] = defineField('endTime')
const [capacity, capacityAttrs] = defineField('capacity')

// Moving the start past the end would leave a session that ends before it
// begins. The picker refuses to set one, and this carries the end along.
watch(startTime, (value) => {
  if (String(endTime.value ?? '') <= String(value ?? '')) {
    endTime.value = nextQuarter(String(value ?? ''))
  }
})

/** The first mark after a time, for pushing the end out of the way. */
function nextQuarter(from: string): string {
  const [h, m] = from.split(':').map(Number)
  const minutes = Math.min(h * 60 + m + 15, 23 * 60 + 45)
  return (
    String(Math.floor(minutes / 60)).padStart(2, '0') +
    ':' +
    String(minutes % 60).padStart(2, '0')
  )
}

/**
 * How the clinic books is not asked here.
 *
 * It was, once per row, which made it a decision the doctor re-made every time
 * they added a day and could answer differently each time without noticing --
 * and left a patient to work out which arrangement applied before picking a
 * day. It is one answer about the clinic now, given above this form, and a new
 * day simply joins it.
 */
const inheritedSlotMinutes = computed(() => store.bookingMode)

/**
 * What the doctor is about to create, in the same words the patient will read
 * it in. A form that only shows its inputs asks somebody to picture the result;
 * this says it.
 */
const preview = computed(() => {
  const draft = {
    startTime: String(startTime.value ?? ''),
    endTime: String(endTime.value ?? ''),
    capacity: Number(capacity.value ?? 0),
    slotMinutes: inheritedSlotMinutes.value,
  } as ScheduleEntry

  if (!draft.startTime || !draft.endTime || draft.endTime <= draft.startTime) return null

  const minutes = minutesPerPatient(draft)

  return {
    windows: windowCount(draft),
    split: draft.slotMinutes !== null,
    length: draft.slotMinutes,
    capacity: draft.capacity,
    minutes,
  }
})

onMounted(() => store.fetchList())

const onSubmit = handleSubmit(async (values) => {
  // The form carries the choice as a string because a select cannot hold null;
  // the database holds null, which is what "one window" is.
  const ok = await store.create({
    ...values,
    // Whatever the clinic runs on, not whatever this form happens to hold.
    slotMinutes: inheritedSlotMinutes.value,
  })
  if (ok) {
    toast.success(t('settings.sessionAdded'))
    resetForm({ values: DEFAULTS })
  } else if (store.error) {
    // The unique index on (doctor, weekday, session) is the likely cause, and
    // "duplicate key value violates..." tells the doctor nothing.
    const duplicate = store.error.message?.includes('duplicate key')
    toast.error(
      t(duplicate ? 'settings.duplicateTitle' : 'settings.addFailed'),
      duplicate ? t('settings.duplicateBody') : store.error.message,
    )
  }
})

async function onRemove(entry: ScheduleEntry) {
  if (await store.remove(entry.id)) toast.success(t('settings.sessionRemoved'))
}

async function onToggle(entry: ScheduleEntry) {
  if (await store.toggleActive(entry)) {
    toast.success(t(entry.isActive ? 'settings.sessionPaused' : 'settings.sessionResumed'))
  }
}

function pace(entry: ScheduleEntry): string {
  const minutes = minutesPerPatient(entry)
  return minutes ? t('settings.perPatient', { minutes }) : ''
}
</script>

<template>
  <div class="space-y-6">
  <BaseCard :title="t('schedule.addTitle')" :subtitle="t('schedule.addSubtitle')">
    <form class="space-y-5" @submit="onSubmit">
      <!-- When, in one row. These four are the easy part and are kept out of
           the way of the one decision that is not. -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <FormField :label="t('settings.day')">
          <BaseSelect v-model="weekday" :options="weekdays" :placeholder="undefined" />
        </FormField>
        <FormField :label="t('settings.session')">
          <BaseSelect v-model="session" :options="sessions" :placeholder="undefined" />
        </FormField>
        <FormField :label="t('settings.start')" :error="errors.startTime">
          <BaseTimePicker v-model="startTime" :invalid="!!errors.startTime" />
        </FormField>
        <FormField :label="t('settings.end')" :error="errors.endTime">
          <!-- Floored at the start, so an end before it cannot be picked. -->
          <BaseTimePicker
            v-model="endTime"
            :min="String(startTime ?? '')"
            :invalid="!!errors.endTime"
          />
        </FormField>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          :label="t('settings.patients')"
          :error="errors.capacity"
          :hint="t('settings.patientsNote')"
        >
          <BaseInput
            v-model="capacity"
            v-bind="capacityAttrs"
            type="number"
            min="1"
            :invalid="!!errors.capacity"
          />
        </FormField>
      </div>

      <!-- What this will look like to a patient, before it is saved. -->
      <div
        v-if="preview"
        class="rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3"
      >
        <p class="text-sm font-medium text-primary-900">{{ t('schedule.previewTitle') }}</p>
        <p class="mt-1 text-sm text-slate-700">
          {{
            preview.split
              ? t('schedule.previewSlots', { count: preview.windows, minutes: preview.length })
              : t('schedule.previewWhole', { count: preview.capacity })
          }}
        </p>
        <p v-if="preview.minutes" class="mt-1 text-xs text-slate-500">
          {{ t('settings.perPatient', { minutes: preview.minutes }) }}
        </p>
      </div>

      <BaseButton type="submit" block :loading="saving">{{ t('schedule.addSession') }}</BaseButton>
    </form>
  </BaseCard>

  <BaseCard :title="t('schedule.weekTitle')" :subtitle="t('schedule.weekSubtitle')">
    <div>
      <BaseEmptyState
        v-if="!loading && items.length === 0"
        :title="t('settings.noDaysTitle')"
        :description="t('settings.noDaysBody')"
      />

      <div v-else class="space-y-1">
        <div
          v-for="day in byWeekday"
          :key="day.value"
          class="flex items-start gap-4 border-b border-surface-border py-3 last:border-0"
        >
          <div class="w-28 shrink-0 pt-0.5 text-sm font-medium text-slate-700">
            {{ day.label }}
          </div>

          <div v-if="day.entries.length === 0" class="pt-0.5 text-sm text-slate-400">{{ t('settings.off') }}</div>

          <ul v-else class="flex-1 space-y-2">
            <li
              v-for="entry in day.entries"
              :key="entry.id"
              class="flex flex-wrap items-center justify-between gap-2"
            >
              <div class="flex flex-wrap items-center gap-3">
                <BaseBadge :tone="entry.isActive ? 'primary' : 'neutral'">
                  {{ labelFor('session', entry.session) }}
                </BaseBadge>
                <span class="text-sm text-slate-700">
                  {{ timeLabel(entry.startTime.slice(0, 5)) }} –
                  {{ timeLabel(entry.endTime.slice(0, 5)) }}
                </span>
                <span class="text-sm text-slate-600">{{ t('settings.patientsCount', { count: entry.capacity }) }}</span>
                <BaseBadge tone="neutral">{{ slotLabel(entry) }}</BaseBadge>
                <span class="text-xs text-slate-400">{{ pace(entry) }}</span>
                <BaseBadge v-if="!entry.isActive" tone="neutral">{{ t('settings.paused') }}</BaseBadge>
              </div>
              <div class="flex items-center gap-1">
                <BaseButton size="sm" variant="ghost" @click="onToggle(entry)">
                  {{ t(entry.isActive ? 'settings.pause' : 'settings.resume') }}
                </BaseButton>
                <BaseButton size="sm" variant="ghost" @click="onRemove(entry)">{{ t('common.remove') }}</BaseButton>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <p v-if="items.length > 0" class="mt-4 text-sm text-slate-500">
        {{ t('settings.weeklyTotal', { count: totalWeeklyCapacity }) }}
      </p>
    </div>
  </BaseCard>
  </div>
</template>
