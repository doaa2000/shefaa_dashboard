<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { clinicBookingSchema, type ClinicBookingFormValues } from '../../domain/appointment.schema'
import type { BookableWindow, RecordClinicBookingInput } from '../../domain/appointment.models'
import { timeLabel } from '@/features/schedule/domain/schedule.models'
import { labelFor } from '@/shared/utils/formatters'
import { BaseButton, BaseInput, BaseModal, BaseSelect, FormField } from '@/shared/ui'

const props = defineProps<{
  modelValue: boolean
  windows: BookableWindow[]
  loadingWindows?: boolean
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'date-change': [date: string]
  submit: [values: RecordClinicBookingInput]
}>()

const { t } = useI18n()

/** YYYY-MM-DD in the clinic's own day, not UTC's. */
function today(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

const { defineField, handleSubmit, errors, resetForm } = useForm<ClinicBookingFormValues>({
  validationSchema: computed(() => toTypedSchema(clinicBookingSchema())),
  initialValues: { bookedDate: today(), paid: false, method: 'cash', amount: '', window: '' },
})

const [name] = defineField('name')
const [phone] = defineField('phone')
const [bookedDate, dateAttrs] = defineField('bookedDate')
const [windowKey] = defineField('window')
const [amount] = defineField('amount')
const [paid] = defineField('paid')
const [method] = defineField('method')

// Opened fresh every time. A form that remembers the last patient's name is a
// form that will one day book the wrong person.
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    resetForm({
      values: { name: '', phone: '', bookedDate: today(), window: '', amount: '', paid: false, method: 'cash' },
    })
    emit('date-change', today())
  },
)

watch(bookedDate, (date) => {
  // The windows belong to the old date until they are re-read, and so does the
  // chosen one.
  windowKey.value = ''
  if (date) emit('date-change', String(date))
})

const keyOf = (w: BookableWindow) => `${w.session}|${w.startTime}|${w.endTime}`

const windowOptions = computed(() =>
  props.windows.map((w) => ({
    value: keyOf(w),
    // The whole state of the window in the option, because the choice is made
    // here and not after it: which session, which hours, and how much room is
    // left in it.
    label:
      `${labelFor('session', w.session)} · ${timeLabel(w.startTime)} – ${timeLabel(w.endTime)} · ` +
      (w.remaining > 0
        ? t('appointments.clinic.remaining', { count: w.remaining })
        : t('appointments.clinic.full')),
  })),
)

const chosen = computed(() => props.windows.find((w) => keyOf(w) === String(windowKey.value ?? '')))

/** Said before the booking is made, not after. The database will accept it --
 *  deliberately -- so the only place this can be a decision is here. */
const overCapacity = computed(() => !!chosen.value && chosen.value.remaining <= 0)

// The three payments_payment_method_check allows, and no more: an option the
// database refuses is a form that fails after it has been filled in.
const methods = computed(() =>
  ['cash', 'instapay', 'card'].map((value) => ({ label: labelFor('method', value), value })),
)

const onSubmit = handleSubmit((form) => {
  const w = props.windows.find((x) => keyOf(x) === form.window)
  if (!w) return
  emit('submit', {
    name: form.name,
    phone: form.phone || undefined,
    bookedDate: form.bookedDate,
    session: w.session,
    startTime: w.startTime,
    endTime: w.endTime,
    amount: form.amount === '' || form.amount === undefined ? null : Number(form.amount),
    paid: !!form.paid,
    method: form.method,
  })
})
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="t('appointments.clinic.title')"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="mb-4 text-sm text-slate-500">{{ t('appointments.clinic.subtitle') }}</p>

    <form id="clinic-booking-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit="onSubmit">
      <FormField :label="t('appointments.clinic.name')" :error="errors.name" required>
        <BaseInput v-model="name" :placeholder="t('appointments.clinic.namePlaceholder')" :invalid="!!errors.name" />
      </FormField>

      <FormField
        :label="t('appointments.clinic.phone')"
        :error="errors.phone"
        :hint="t('appointments.clinic.phoneHint')"
      >
        <BaseInput v-model="phone" type="tel" inputmode="tel" placeholder="01xxxxxxxxx" :invalid="!!errors.phone" />
      </FormField>

      <FormField :label="t('appointments.clinic.date')" :error="errors.bookedDate" required>
        <BaseInput v-model="bookedDate" v-bind="dateAttrs" type="date" :invalid="!!errors.bookedDate" />
      </FormField>

      <FormField
        :label="t('appointments.clinic.window')"
        :error="errors.window"
        :hint="loadingWindows ? t('common.loading') : undefined"
        required
      >
        <BaseSelect
          v-model="windowKey"
          :options="windowOptions"
          :disabled="loadingWindows || windowOptions.length === 0"
          :placeholder="
            loadingWindows
              ? t('common.loading')
              : windowOptions.length === 0
                ? t('appointments.clinic.noWindows')
                : t('appointments.clinic.pickWindow')
          "
          :invalid="!!errors.window"
        />
      </FormField>

      <!-- The one thing the clinic is owed before they decide, rather than in
           a toast after the booking already exists. -->
      <p
        v-if="overCapacity"
        class="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
      >
        {{ t('appointments.clinic.overCapacityWarning', { capacity: chosen?.capacity ?? 0 }) }}
      </p>

      <FormField
        :label="t('appointments.clinic.fee')"
        :error="errors.amount"
        :hint="t('appointments.clinic.feeHint')"
      >
        <BaseInput v-model="amount" type="number" min="0" step="1" :invalid="!!errors.amount" />
      </FormField>

      <FormField :label="t('appointments.clinic.method')">
        <BaseSelect v-model="method" :options="methods" :placeholder="undefined" />
      </FormField>

      <label class="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
        <input v-model="paid" type="checkbox" class="h-4 w-4 rounded border-surface-border" />
        {{ t('appointments.clinic.paid') }}
      </label>

      <p class="sm:col-span-2 text-xs text-slate-500">
        {{ t('appointments.clinic.noCommission') }}
      </p>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="emit('update:modelValue', false)">
          {{ t('common.cancel') }}
        </BaseButton>
        <BaseButton type="submit" form="clinic-booking-form" :loading="saving">
          {{ t('appointments.clinic.save') }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
