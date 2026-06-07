<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { appointmentSchema, type AppointmentFormValues } from '../../domain/appointment.schema'
import { TYPE_OPTIONS } from '../../domain/appointment.labels'
import type { Appointment } from '../../domain/appointment.models'
import { usePatientOptions } from '@/features/patients/application/usePatientOptions'
import { toDatetimeLocalValue } from '@/shared/utils/datetime'
import { BaseButton, BaseInput, BaseModal, BaseSelect, FormField } from '@/shared/ui'

const props = defineProps<{ modelValue: boolean; appointment?: Appointment | null; saving?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [values: AppointmentFormValues]
}>()

const { options: patientOptions } = usePatientOptions()

const { defineField, handleSubmit, errors, resetForm } = useForm<AppointmentFormValues>({
  validationSchema: toTypedSchema(appointmentSchema),
  initialValues: { type: 'in_person', durationMinutes: 30 },
})

const [patientId] = defineField('patientId')
const [scheduledAt, scheduledAttrs] = defineField('scheduledAt')
const [durationMinutes, durationAttrs] = defineField('durationMinutes')
const [type] = defineField('type')
const [reason, reasonAttrs] = defineField('reason')
const [notes, notesAttrs] = defineField('notes')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.appointment) {
      resetForm({
        values: {
          patientId: props.appointment.patientId,
          scheduledAt: toDatetimeLocalValue(props.appointment.scheduledAt),
          durationMinutes: props.appointment.durationMinutes,
          type: props.appointment.type,
          reason: props.appointment.reason ?? '',
          notes: props.appointment.notes ?? '',
        },
      })
    } else {
      resetForm({ values: { type: 'in_person', durationMinutes: 30, scheduledAt: '' } })
    }
  },
)

const onSubmit = handleSubmit((values) =>
  emit('submit', { ...values, scheduledAt: new Date(values.scheduledAt).toISOString() }),
)
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="appointment ? 'Edit appointment' : 'New appointment'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="appointment-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit="onSubmit">
      <FormField class="sm:col-span-2" label="Patient" :error="errors.patientId" required>
        <BaseSelect v-model="patientId" :options="patientOptions" placeholder="Select a patient" :invalid="!!errors.patientId" />
      </FormField>
      <FormField label="Date & time" :error="errors.scheduledAt" required>
        <BaseInput v-model="scheduledAt" v-bind="scheduledAttrs" type="datetime-local" :invalid="!!errors.scheduledAt" />
      </FormField>
      <FormField label="Duration (minutes)" :error="errors.durationMinutes" required>
        <BaseInput v-model="durationMinutes" v-bind="durationAttrs" type="number" :invalid="!!errors.durationMinutes" />
      </FormField>
      <FormField label="Type">
        <BaseSelect v-model="type" :options="TYPE_OPTIONS" :placeholder="undefined" />
      </FormField>
      <FormField label="Reason" :error="errors.reason">
        <BaseInput v-model="reason" v-bind="reasonAttrs" placeholder="e.g. Follow-up" />
      </FormField>
      <FormField class="sm:col-span-2" label="Notes" :error="errors.notes">
        <textarea
          v-model="notes"
          v-bind="notesAttrs"
          rows="3"
          class="w-full rounded-xl border border-surface-border px-3.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </FormField>
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="emit('update:modelValue', false)">Cancel</BaseButton>
        <BaseButton type="submit" form="appointment-form" :loading="saving">Save appointment</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
