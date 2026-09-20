<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { appointmentSchema, type AppointmentFormValues } from '../../domain/appointment.schema'
import { statusOptions } from '../../domain/appointment.labels'
import { sessionOptions } from '@/features/schedule/domain/schedule.models'
import type { Appointment } from '../../domain/appointment.models'
import { usePatientOptions } from '@/features/patients/application/usePatientOptions'
import { BaseButton, BaseInput, BaseModal, BaseSelect, BaseTimePicker, FormField } from '@/shared/ui'

const props = defineProps<{ modelValue: boolean; appointment?: Appointment | null; saving?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [values: AppointmentFormValues]
}>()

const { options: patientOptions } = usePatientOptions()
const { t } = useI18n()

const statuses = computed(() => statusOptions())
const sessions = computed(() => sessionOptions())

const { defineField, handleSubmit, errors, resetForm } = useForm<AppointmentFormValues>({
  // A computed schema, so the messages follow a language change instead of
  // staying in whichever one the form was opened in.
  validationSchema: computed(() => toTypedSchema(appointmentSchema())),
  initialValues: { status: 'pending' },
})

const [patientId] = defineField('patientId')
const [bookedDate, dateAttrs] = defineField('bookedDate')
const [session] = defineField('session')
const [startTime] = defineField('startTime')
const [endTime] = defineField('endTime')

// The same picker the schedule page uses, and the same floor: the end cannot
// be set before the start, and moving the start carries it along.
watch(startTime, (value) => {
  if (String(endTime.value ?? '') <= String(value ?? '')) {
    const [h, m] = String(value ?? '00:00').split(':').map(Number)
    const minutes = Math.min(h * 60 + m + 15, 23 * 60 + 45)
    endTime.value =
      String(Math.floor(minutes / 60)).padStart(2, '0') +
      ':' +
      String(minutes % 60).padStart(2, '0')
  }
})
const [status] = defineField('status')

// Only ever opened on an existing booking: the dashboard does not create them.
watch(
  () => props.modelValue,
  (open) => {
    const a = props.appointment
    if (!open || !a) return
    resetForm({
      values: {
        patientId: a.patientId,
        bookedDate: a.bookedDate,
        session: a.session === 'evening' ? 'evening' : 'morning',
        startTime: a.startTime?.slice(0, 5),
        endTime: a.endTime?.slice(0, 5),
        status: a.status,
      },
    })
  },
)

const onSubmit = handleSubmit((values) => emit('submit', values))
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="t('appointments.modal.editTitle')"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="appointment-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit="onSubmit">
      <FormField class="sm:col-span-2" :label="t('appointments.modal.patient')" :error="errors.patientId" required>
        <BaseSelect v-model="patientId" :options="patientOptions" :placeholder="t('appointments.modal.selectPatient')" :invalid="!!errors.patientId" />
      </FormField>
      <FormField :label="t('appointments.modal.date')" :error="errors.bookedDate" required>
        <BaseInput v-model="bookedDate" v-bind="dateAttrs" type="date" :invalid="!!errors.bookedDate" />
      </FormField>
      <FormField :label="t('appointments.modal.session')" :error="errors.session" required>
        <BaseSelect v-model="session" :options="sessions" :placeholder="undefined" :invalid="!!errors.session" />
      </FormField>
      <FormField :label="t('appointments.modal.status')">
        <BaseSelect v-model="status" :options="statuses" :placeholder="undefined" />
      </FormField>
      <FormField :label="t('appointments.modal.startTime')" :error="errors.startTime" required>
        <BaseTimePicker v-model="startTime" :invalid="!!errors.startTime" />
      </FormField>
      <FormField :label="t('appointments.modal.endTime')" :error="errors.endTime" required>
        <BaseTimePicker
          v-model="endTime"
          :min="String(startTime ?? '')"
          :invalid="!!errors.endTime"
        />
      </FormField>
</form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="emit('update:modelValue', false)">
          {{ t('common.cancel') }}
        </BaseButton>
        <BaseButton type="submit" form="appointment-form" :loading="saving">
          {{ t('appointments.modal.save') }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
