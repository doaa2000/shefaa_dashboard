<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useScheduleStore } from '../../store/schedule.store'
import { scheduleSchema, type ScheduleFormValues } from '../../domain/schedule.schema'
import {
  SESSION_OPTIONS,
  SLOT_OPTIONS,
  WEEKDAY_OPTIONS,
  WHOLE_SESSION,
  minutesPerPatient,
  slotLabel,
  toSlotMinutes,
  type ScheduleEntry,
} from '../../domain/schedule.models'
import { useToast } from '@/shared/composables/useToast'
import { titleCase } from '@/shared/utils/formatters'
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
  validationSchema: toTypedSchema(scheduleSchema),
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
    toast.success('Session added to your week')
    resetForm({ values: DEFAULTS })
  } else if (store.error) {
    // The unique index on (doctor, weekday, session) is the likely cause, and
    // "duplicate key value violates..." tells the doctor nothing.
    const duplicate = store.error.message?.includes('duplicate key')
    toast.error(
      duplicate ? 'That day already has this session' : 'Could not add the session',
      duplicate ? 'Edit the existing one instead of adding a second.' : store.error.message,
    )
  }
})

async function onRemove(entry: ScheduleEntry) {
  if (await store.remove(entry.id)) toast.success('Session removed')
}

async function onToggle(entry: ScheduleEntry) {
  if (await store.toggleActive(entry)) {
    toast.success(entry.isActive ? 'Session paused' : 'Session resumed')
  }
}

function pace(entry: ScheduleEntry): string {
  const minutes = minutesPerPatient(entry)
  return minutes ? `≈ ${minutes} min each` : ''
}
</script>

<template>
  <BaseCard
    title="Weekly schedule"
    subtitle="The days you work. Availability for every date is worked out from this, so there is nothing to keep topping up."
  >
    <form class="grid grid-cols-1 gap-3 sm:grid-cols-6" @submit="onSubmit">
      <FormField label="Day">
        <BaseSelect v-model="weekday" :options="WEEKDAY_OPTIONS" :placeholder="undefined" />
      </FormField>
      <FormField label="Session">
        <BaseSelect v-model="session" :options="SESSION_OPTIONS" :placeholder="undefined" />
      </FormField>
      <FormField label="Start" :error="errors.startTime">
        <BaseInput v-model="startTime" v-bind="startAttrs" type="time" :invalid="!!errors.startTime" />
      </FormField>
      <FormField label="End" :error="errors.endTime">
        <BaseInput v-model="endTime" v-bind="endAttrs" type="time" :invalid="!!errors.endTime" />
      </FormField>
      <FormField label="Patients" :error="errors.capacity">
        <BaseInput
          v-model="capacity"
          v-bind="capacityAttrs"
          type="number"
          min="1"
          :invalid="!!errors.capacity"
        />
      </FormField>
      <FormField label="Appointments">
        <BaseSelect v-model="slotMinutes" :options="SLOT_OPTIONS" :placeholder="undefined" />
      </FormField>
      <div class="flex items-end sm:col-span-6">
        <BaseButton type="submit" block :loading="saving">Add</BaseButton>
      </div>
    </form>

    <p class="mt-2 text-xs text-slate-500">
      “Patients” is how many you see in that session — your own number, not a calculation.
      A session that runs long for some patients and short for others still has one honest total.
    </p>
    <p class="mt-1 text-xs text-slate-500">
      “Appointments” decides what a patient is told. <strong>Whole session</strong> shows them the
      session as one window and asks them to arrive in it — right for a clinic that sees people in
      the order they walk in. A length splits the session into separate times to book, and the
      patients are spread across them.
    </p>

    <div class="mt-5">
      <BaseEmptyState
        v-if="!loading && items.length === 0"
        title="No working days yet"
        description="Add the days you see patients. Every bookable date is derived from them."
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

          <div v-if="day.entries.length === 0" class="pt-0.5 text-sm text-slate-400">Off</div>

          <ul v-else class="flex-1 space-y-2">
            <li
              v-for="entry in day.entries"
              :key="entry.id"
              class="flex flex-wrap items-center justify-between gap-2"
            >
              <div class="flex flex-wrap items-center gap-3">
                <BaseBadge :tone="entry.isActive ? 'primary' : 'neutral'">
                  {{ titleCase(entry.session) }}
                </BaseBadge>
                <span class="text-sm text-slate-700">
                  {{ entry.startTime.slice(0, 5) }} – {{ entry.endTime.slice(0, 5) }}
                </span>
                <span class="text-sm text-slate-600">{{ entry.capacity }} patients</span>
                <BaseBadge tone="neutral">{{ slotLabel(entry) }}</BaseBadge>
                <span class="text-xs text-slate-400">{{ pace(entry) }}</span>
                <BaseBadge v-if="!entry.isActive" tone="neutral">Paused</BaseBadge>
              </div>
              <div class="flex items-center gap-1">
                <BaseButton size="sm" variant="ghost" @click="onToggle(entry)">
                  {{ entry.isActive ? 'Pause' : 'Resume' }}
                </BaseButton>
                <BaseButton size="sm" variant="ghost" @click="onRemove(entry)">Remove</BaseButton>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <p v-if="items.length > 0" class="mt-4 text-sm text-slate-500">
        {{ totalWeeklyCapacity }} patients a week across your active sessions.
      </p>
    </div>
  </BaseCard>
</template>
