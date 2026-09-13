<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useScheduleStore } from '../../store/schedule.store'
import { scheduleSchema, type ScheduleFormValues } from '../../domain/schedule.schema'
import {
  sessionOptions,
  slotOptions,
  weekdayOptions,
  WHOLE_SESSION,
  minutesPerPatient,
  slotLabel,
  toSlotMinutes,
  type ScheduleEntry,
} from '../../domain/schedule.models'
import { useToast } from '@/shared/composables/useToast'
import { labelFor } from '@/shared/utils/formatters'
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseBadge,
  FormField,
  BaseEmptyState,
} from '@/shared/ui'

const store = useScheduleStore()
const toast = useToast()
const { t } = useI18n()

const weekdays = computed(() => weekdayOptions())
const sessions = computed(() => sessionOptions())
const slots = computed(() => slotOptions())
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
const [startTime, startAttrs] = defineField('startTime')
const [endTime, endAttrs] = defineField('endTime')
const [capacity, capacityAttrs] = defineField('capacity')
const [slotMinutes] = defineField('slotMinutes')

onMounted(() => store.fetchList())

const onSubmit = handleSubmit(async (values) => {
  // The form carries the choice as a string because a select cannot hold null;
  // the database holds null, which is what "one window" is.
  const ok = await store.create({
    ...values,
    slotMinutes: toSlotMinutes(values.slotMinutes),
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
  <BaseCard :title="t('settings.schedule')" :subtitle="t('settings.scheduleSubtitle')">
    <form class="grid grid-cols-1 gap-3 sm:grid-cols-6" @submit="onSubmit">
      <FormField :label="t('settings.day')">
        <BaseSelect v-model="weekday" :options="weekdays" :placeholder="undefined" />
      </FormField>
      <FormField :label="t('settings.session')">
        <BaseSelect v-model="session" :options="sessions" :placeholder="undefined" />
      </FormField>
      <FormField :label="t('settings.start')" :error="errors.startTime">
        <BaseInput v-model="startTime" v-bind="startAttrs" type="time" :invalid="!!errors.startTime" />
      </FormField>
      <FormField :label="t('settings.end')" :error="errors.endTime">
        <BaseInput v-model="endTime" v-bind="endAttrs" type="time" :invalid="!!errors.endTime" />
      </FormField>
      <FormField :label="t('settings.patients')" :error="errors.capacity">
        <BaseInput
          v-model="capacity"
          v-bind="capacityAttrs"
          type="number"
          min="1"
          :invalid="!!errors.capacity"
        />
      </FormField>
      <FormField :label="t('settings.appointmentsField')">
        <BaseSelect v-model="slotMinutes" :options="slots" :placeholder="undefined" />
      </FormField>
      <div class="flex items-end sm:col-span-6">
        <BaseButton type="submit" block :loading="saving">{{ t('common.add') }}</BaseButton>
      </div>
    </form>

    <p class="mt-2 text-xs text-slate-500">{{ t('settings.patientsNote') }}</p>
    <p class="mt-1 text-xs text-slate-500">{{ t('settings.appointmentsNote') }}</p>

    <div class="mt-5">
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
                  {{ entry.startTime.slice(0, 5) }} – {{ entry.endTime.slice(0, 5) }}
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
</template>
