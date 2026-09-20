<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useScheduleStore } from '../../store/schedule.store'
import { slotOptions, WHOLE_SESSION, toSlotMinutes } from '../../domain/schedule.models'
import { useToast } from '@/shared/composables/useToast'
import { BaseButton, BaseCard, BaseSelect, FormField } from '@/shared/ui'

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

/** The lengths, without the "whole session" entry the two cards now carry. */
const lengths = computed(() => slotOptions().filter((s) => s.value !== WHOLE_SESSION))

const chosen = computed(() => (split.value ? toSlotMinutes(length.value) : null))

const dirty = computed(() => bookingModeMixed.value || chosen.value !== bookingMode.value)

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

      <FormField v-if="split" :label="t('schedule.lengthField')" class="sm:w-56">
        <BaseSelect v-model="length" :options="lengths" :placeholder="undefined" />
      </FormField>

      <div class="flex flex-wrap items-center gap-3">
        <BaseButton :disabled="!dirty || !items.length" :loading="saving" @click="save">
          {{ t('schedule.modeSave') }}
        </BaseButton>
        <!-- Said before it is pressed, because it reaches days the doctor is
             not looking at, paused ones included. -->
        <p v-if="items.length" class="text-sm text-slate-500">
          {{ t('schedule.modeApplies', { count: items.length }) }}
        </p>
        <p v-else class="text-sm text-slate-500">{{ t('schedule.modeNoDays') }}</p>
      </div>
    </div>
  </BaseCard>
</template>
