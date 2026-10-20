<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useScheduleStore } from '../../store/schedule.store'
import { scheduleSchema, type ScheduleFormValues } from '../../domain/schedule.schema'
import {
  weekdayOptions,
  weekdayLabel,
  dayList,
  rowSummary,
  timeLabel,
  type ScheduleEntry,
} from '../../domain/schedule.models'
import {
  conflictOn,
  planRow,
  planSlots,
  rowMatchesLength,
  sampleTimes,
  type Conflict,
} from '../../domain/schedule.plan'
import { useToast } from '@/shared/composables/useToast'
import { labelFor } from '@/shared/utils/formatters'
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseTimePicker,
  BaseBadge,
  FormField,
  BaseEmptyState,
} from '@/shared/ui'

const store = useScheduleStore()
const toast = useToast()
const { t } = useI18n()

const weekdays = computed(() => weekdayOptions())
const { byWeekday, items, loading, saving, totalWeeklyCapacity } = storeToRefs(store)

/**
 * How the clinic books is not asked here.
 *
 * It was, once per row, which made it a decision the doctor re-made every time
 * they added a day and could answer differently each time without noticing --
 * and left a patient to work out which arrangement applied before picking a
 * day. It is one answer about the clinic now, given above this form, and a new
 * day simply joins it. It also decides which one number this form asks for.
 */
const slotMinutes = computed(() => store.bookingMode)

const DEFAULTS: ScheduleFormValues = {
  weekdays: [],
  startTime: '09:00',
  endTime: '13:00',
  patients: 16,
  isActive: true,
}

const { defineField, handleSubmit, errors, resetForm, setFieldError } =
  useForm<ScheduleFormValues>({
    // A computed schema, so the messages follow a language change, and the
    // patients field is only required while the clinic books by queue.
    validationSchema: computed(() => toTypedSchema(scheduleSchema(slotMinutes.value))),
    initialValues: DEFAULTS,
  })

const [days] = defineField('weekdays')
const [startTime] = defineField('startTime')
const [endTime] = defineField('endTime')
const [patients, patientsAttrs] = defineField('patients')

/** The row being edited, or null while the form adds new days. */
const editing = ref<ScheduleEntry | null>(null)
const formEl = ref<HTMLElement | null>(null)

/**
 * Several days at once when adding: most clinics keep the same hours on four
 * or five days, and adding them one by one was the same form filled in five
 * times. Editing is one row, so a tap there moves it to another day instead.
 */
function toggleDay(value: number) {
  const current = (days.value ?? []) as number[]
  if (editing.value) {
    days.value = [value]
    return
  }
  days.value = current.includes(value)
    ? current.filter((d) => d !== value)
    : [...current, value].sort((a, b) => a - b)
}

// Moving the start past the end would leave a day that ends before it
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

const clock = (value: string) => timeLabel(value.slice(0, 5))

/**
 * What the patient will be offered, in the words they will read it in, before
 * anything is saved. The old line here was minutes per patient, which asked
 * the doctor to picture the result; this lists it.
 */
const preview = computed(() => {
  const start = String(startTime.value ?? '')
  const end = String(endTime.value ?? '')
  if (!start || !end || end <= start) return null

  const length = slotMinutes.value
  if (length === null) {
    const count = Number(patients.value ?? 0)
    if (!Number.isInteger(count) || count < 1) return null
    return { line: t('schedule.previewQueue', { count, from: clock(start), to: clock(end) }) }
  }

  const plan = planSlots(start, end, length)
  if (plan.count === 0) return null
  const { head, last } = sampleTimes(plan.starts)
  const times = head.map(clock).join(t('schedule.timesSep')) + (last ? ` … ${clock(last)}` : '')
  return {
    line: t('schedule.previewSlots', { count: plan.count, times }),
    // Said only when it applies: the minutes after the last whole
    // appointment are not offered, and the day is saved to end there.
    leftover:
      plan.leftover > 0
        ? t('schedule.previewLeftover', {
            end: clock(plan.lastEnd),
            minutes: plan.leftover,
            to: clock(end),
          })
        : null,
  }
})

/** The day's existing hours as the sentence a refusal quotes. */
function describe(id: number): string {
  const e = items.value.find((x) => x.id === id)
  return e ? `${clock(e.startTime)} – ${clock(e.endTime)}` : ''
}

/** Every chosen day these hours cannot go on, worded per day. */
function conflictsFor(
  chosen: number[],
  row: { session: string; startTime: string; endTime: string },
): string[] {
  const out: string[] = []
  for (const weekday of chosen) {
    const c: Conflict | null = conflictOn(items.value, weekday, row, editing.value?.id)
    if (!c) continue
    out.push(
      t(c.kind === 'sameSession' ? 'schedule.conflictSession' : 'schedule.conflictOverlap', {
        day: weekdayLabel(weekday),
        session: labelFor('session', row.session),
        hours: describe(c.withId),
      }),
    )
  }
  return out
}

const conflicts = ref<string[]>([])

function startEdit(entry: ScheduleEntry) {
  editing.value = entry
  conflicts.value = []
  resetForm({
    values: {
      weekdays: [entry.weekday],
      startTime: entry.startTime.slice(0, 5),
      endTime: entry.endTime.slice(0, 5),
      patients: entry.capacity,
      isActive: entry.isActive,
    },
  })
  formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function cancelEdit() {
  editing.value = null
  conflicts.value = []
  resetForm({ values: DEFAULTS })
}

onMounted(() => store.fetchList())

const onSubmit = handleSubmit(async (values) => {
  const row = planRow(
    values.startTime,
    values.endTime,
    slotMinutes.value,
    Number(values.patients ?? 0),
  )
  if (!row) {
    setFieldError('endTime', t('validation.shorterThanSlot', { minutes: slotMinutes.value ?? 0 }))
    return
  }

  // Said here, per day, rather than left to the unique index: "duplicate key
  // value violates..." tells the doctor nothing, and an overlap between the
  // two halves of a day is something the database would let through.
  conflicts.value = conflictsFor(values.weekdays, row)
  if (conflicts.value.length) return

  if (editing.value) {
    const ok = await store.update(editing.value.id, {
      ...row,
      weekday: values.weekdays[0],
    })
    if (ok) {
      toast.success(t('schedule.dayUpdated'))
      cancelEdit()
    } else if (store.error) {
      toast.error(t('schedule.updateFailed'), store.error.message)
    }
    return
  }

  const { added, failed } = await store.createMany(values.weekdays, {
    ...row,
    isActive: true,
  })
  if (added.length) {
    toast.success(
      t('schedule.daysAdded', { days: dayList(added) }),
    )
  }
  if (failed.length) {
    toast.error(
      t('schedule.daysFailed', { days: dayList(failed.map((f) => f.weekday)) }),
      failed[0].error.message,
    )
    // What did go in leaves the selection; what did not stays, ready to retry.
    days.value = failed.map((f) => f.weekday)
  } else {
    resetForm({ values: DEFAULTS })
  }
})

async function onRemove(entry: ScheduleEntry) {
  if (editing.value?.id === entry.id) cancelEdit()
  if (await store.remove(entry.id)) toast.success(t('settings.sessionRemoved'))
}

async function onToggle(entry: ScheduleEntry) {
  if (await store.toggleActive(entry)) {
    toast.success(t(entry.isActive ? 'settings.sessionPaused' : 'settings.sessionResumed'))
  }
}
</script>

<template>
  <div class="space-y-6">
  <div ref="formEl">
  <BaseCard
    :title="t(editing ? 'schedule.editTitle' : 'schedule.addTitle')"
    :subtitle="t(editing ? 'schedule.editSubtitle' : 'schedule.addSubtitle')"
  >
    <form class="space-y-5" @submit="onSubmit">
      <FormField
        :label="t(editing ? 'settings.day' : 'schedule.daysField')"
        :error="errors.weekdays"
      >
        <div class="flex flex-wrap gap-2">
          <button
            v-for="day in weekdays"
            :key="day.value"
            type="button"
            class="h-9 rounded-full border px-4 text-sm transition-colors"
            :class="(days ?? []).includes(day.value)
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-surface-border bg-white text-slate-700 hover:bg-primary-50'"
            :aria-pressed="(days ?? []).includes(day.value)"
            @click="toggleDay(day.value)"
          >
            {{ day.label }}
          </button>
        </div>
      </FormField>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <!-- The one number, and only by queue. With fixed appointments the
             length set above decides how many there are. -->
        <FormField
          v-if="slotMinutes === null"
          :label="t('settings.patients')"
          :error="errors.patients"
        >
          <BaseInput
            v-model="patients"
            v-bind="patientsAttrs"
            type="number"
            min="1"
            :invalid="!!errors.patients"
          />
        </FormField>
        <FormField v-else :label="t('schedule.lengthField')" :hint="t('schedule.lengthFromMode')">
          <p class="flex h-10 items-center text-sm text-slate-700">
            {{ t('settings.minutes', { count: slotMinutes }) }}
          </p>
        </FormField>
      </div>

      <!-- What this will look like to a patient, before it is saved. -->
      <div
        v-if="preview"
        class="rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3"
      >
        <p class="text-sm text-slate-800">
          <span class="font-medium text-primary-900">{{ t('schedule.previewTitle') }}</span>
          {{ preview.line }}
        </p>
        <p v-if="preview.leftover" class="mt-1 text-xs text-slate-600">{{ preview.leftover }}</p>
      </div>

      <ul
        v-if="conflicts.length"
        class="space-y-1 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        <li v-for="line in conflicts" :key="line">{{ line }}</li>
      </ul>

      <div class="flex flex-wrap gap-2">
        <BaseButton type="submit" class="flex-1" :loading="saving">
          {{ t(editing ? 'schedule.saveEdit' : 'schedule.addSession') }}
        </BaseButton>
        <BaseButton v-if="editing" type="button" variant="ghost" @click="cancelEdit">
          {{ t('common.cancel') }}
        </BaseButton>
      </div>
    </form>
  </BaseCard>
  </div>

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
                  {{ clock(entry.startTime) }} – {{ clock(entry.endTime) }}
                </span>
                <span class="text-sm text-slate-600">{{ rowSummary(entry) }}</span>
                <!-- A day saved before the length decided the count can be
                     hiding appointments from patients. Saving it again from
                     the edit form puts it right. -->
                <BaseBadge v-if="!rowMatchesLength(entry)" tone="warning">
                  {{ t('schedule.rowMismatch') }}
                </BaseBadge>
                <BaseBadge v-if="!entry.isActive" tone="neutral">{{ t('settings.paused') }}</BaseBadge>
              </div>
              <div class="flex items-center gap-1">
                <BaseButton size="sm" variant="ghost" @click="startEdit(entry)">
                  {{ t('common.edit') }}
                </BaseButton>
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
