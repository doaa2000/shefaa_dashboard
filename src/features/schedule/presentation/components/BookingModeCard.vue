<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useScheduleStore } from '../../store/schedule.store'
import { MAX_LENGTH, MIN_LENGTH, dayList } from '../../domain/schedule.models'
import { rowMatchesLength } from '../../domain/schedule.plan'
import { useToast } from '@/shared/composables/useToast'
import { BaseButton, BaseCard, BaseInput, FormField } from '@/shared/ui'

const store = useScheduleStore()
const toast = useToast()
const { t } = useI18n()
const { bookingMode, bookingModeMixed, items, saving } = storeToRefs(store)

/**
 * The choice, held here until it is saved.
 *
 * It used to sit inside the form that adds a day, which made it a decision the
 * doctor re-made on every row -- and one they could answer differently each
 * time without noticing. It is one answer about the clinic, so it is asked
 * once and written across the week.
 */
const split = ref(bookingMode.value !== null)
const length = ref(String(bookingMode.value ?? 20))

// The week arrives after this is first drawn, so the controls follow it.
watch(bookingMode, (value) => {
  split.value = value !== null
  if (value !== null) length.value = String(value)
})

/**
 * The length as typed, or null while it is not one the form takes. Typed
 * rather than picked from four: a clinic that runs to twenty-five minutes
 * should not have to round to the nearest one offered.
 */
const typedLength = computed(() => {
  const n = Number(length.value)
  return Number.isInteger(n) && n >= MIN_LENGTH && n <= MAX_LENGTH ? n : null
})

const lengthError = computed(() =>
  split.value && typedLength.value === null
    ? t('validation.lengthRange', { min: MIN_LENGTH, max: MAX_LENGTH })
    : undefined,
)

const chosen = computed(() => (split.value ? typedLength.value : null))

/** Days whose hours would not hold one appointment of this length. */
const tooShort = computed(() =>
  split.value && typedLength.value !== null ? store.rowsTooShortFor(typedLength.value) : [],
)

const tooShortDays = computed(() =>
  dayList([...new Set(tooShort.value.map((e) => e.weekday))]),
)

/**
 * Worth saving even unchanged when a day was saved before the length decided
 * its count: saving again is what puts its hidden appointments back.
 */
const needsFix = computed(() => items.value.some((e) => !rowMatchesLength(e)))

const dirty = computed(
  () => bookingModeMixed.value || needsFix.value || chosen.value !== bookingMode.value,
)

const canSave = computed(
  () => dirty.value && !!items.value.length && !lengthError.value && !tooShort.value.length,
)

async function save() {
  if (await store.setBookingMode(chosen.value)) toast.success(t('schedule.modeSaved'))
  else if (store.error) toast.error(t('schedule.modeFailed'), store.error.message)
}
</script>

<template>
  <BaseCard :title="t('schedule.modeTitle')" :subtitle="t('schedule.modeSubtitle')">
    <div class="space-y-4">
      <!-- Only when the week disagrees with itself, which this page cannot
           produce: saving writes every row at once. It means the rows were
           changed elsewhere, and the doctor is the one who should settle it. -->
      <p
        v-if="bookingModeMixed"
        class="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        {{ t('schedule.modeMixed') }}
      </p>

      <!-- Two things a clinic does, rather than two values of a field.
           Choosing one is choosing how the waiting room behaves. -->
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          class="rounded-2xl border p-4 text-start transition-colors"
          :class="!split
            ? 'border-primary-600 bg-primary-50'
            : 'border-surface-border bg-white hover:bg-primary-50'"
          @click="split = false"
        >
          <p class="text-sm font-semibold text-slate-800">{{ t('schedule.wholeTitle') }}</p>
          <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ t('schedule.wholeBody') }}</p>
        </button>

        <button
          type="button"
          class="rounded-2xl border p-4 text-start transition-colors"
          :class="split
            ? 'border-primary-600 bg-primary-50'
            : 'border-surface-border bg-white hover:bg-primary-50'"
          @click="split = true"
        >
          <p class="text-sm font-semibold text-slate-800">{{ t('schedule.slotsTitle') }}</p>
          <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ t('schedule.slotsBody') }}</p>
        </button>
      </div>

      <FormField
        v-if="split"
        :label="t('schedule.lengthField')"
        :error="lengthError"
        :hint="t('schedule.lengthHint')"
        class="sm:w-72"
      >
        <BaseInput
          v-model="length"
          type="number"
          :min="MIN_LENGTH"
          :max="MAX_LENGTH"
          :invalid="!!lengthError"
        />
      </FormField>

      <!-- Named before saving, so nothing half-changes: these days would end
           up with no appointment at all. -->
      <p
        v-if="tooShort.length"
        class="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        {{ t('schedule.lengthTooLong', { days: tooShortDays, minutes: typedLength }) }}
      </p>

      <div class="flex flex-wrap items-center gap-3">
        <BaseButton :disabled="!canSave" :loading="saving" @click="save">
          {{ t('schedule.modeSave') }}
        </BaseButton>
        <!-- Said before it is pressed, because it reaches days the doctor is
             not looking at, paused ones included. -->
        <p v-if="items.length" class="text-sm text-slate-500">
          {{ t('schedule.modeApplies', { count: items.length }) }}
          <!-- A length rewrites more than the column, and the doctor should
               know before pressing that the count and the end may move. -->
          <template v-if="split">{{ t('schedule.modeAppliesSlots') }}</template>
        </p>
        <p v-else class="text-sm text-slate-500">{{ t('schedule.modeNoDays') }}</p>
      </div>
    </div>
  </BaseCard>
</template>
