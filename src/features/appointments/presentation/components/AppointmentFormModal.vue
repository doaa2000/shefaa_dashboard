<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { appointmentSchema, type AppointmentFormValues } from '../../domain/appointment.schema'
import { STATUS_OPTIONS } from '../../domain/appointment.labels'
import type { Appointment } from '../../domain/appointment.models'
import { usePatientOptions } from '@/features/patients/application/usePatientOptions'
import { BaseButton, BaseInput, BaseModal, BaseSelect, FormField } from '@/shared/ui'

const props = defineProps<{ modelValue: boolean; appointment?: Appointment | null; saving?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [values: AppointmentFormValues]
}>()

const { options: patientOptions } = usePatientOptions()

const { defineField, handleSubmit, errors, resetForm } = useForm<AppointmentFormValues>({
  validationSchema: toTypedSchema(appointmentSchema),
  initialValues: { status: 'pending' },
})

const [patientId] = defineField('patientId')
const [bookedDate, dateAttrs] = defineField('bookedDate')
const [startTime, startAttrs] = defineField('startTime')
const [endTime, endAttrs] = defineField('endTime')
const [status] = defineField('status')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.appointment) {
      const a = props.appointment
      resetForm({
        values: {
          patientId: a.patientId,
          bookedDate: a.bookedDate,
          startTime: a.startTime?.slice(0, 5),
          endTime: a.endTime?.slice(0, 5),
          status: a.status,
        },
      })
    } else {
      resetForm({ values: { status: 'pending', bookedDate: new Date().toISOString().slice(0, 10) } })
    }
  },
)

const onSubmit = handleSubmit((values) => emit('submit', values))
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
      <FormField label="Date" :error="errors.bookedDate" required>
        <BaseInput v-model="bookedDate" v-bind="dateAttrs" type="date" :invalid="!!errors.bookedDate" />
      </FormField>
      <FormField label="Status">
        <BaseSelect v-model="status" :options="STATUS_OPTIONS" :placeholder="undefined" />
      </FormField>
      <FormField label="Start time" :error="errors.startTime" required>
        <BaseInput v-model="startTime" v-bind="startAttrs" type="time" :invalid="!!errors.startTime" />
      </FormField>
      <FormField label="End time" :error="errors.endTime" required>
        <BaseInput v-model="endTime" v-bind="endAttrs" type="time" :invalid="!!errors.endTime" />
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
