<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { consultationSchema, type ConsultationFormValues } from '../../domain/consultation.schema'
import type { Consultation } from '../../domain/consultation.models'
import { usePatientOptions } from '@/features/patients/application/usePatientOptions'
import { BaseButton, BaseInput, BaseModal, BaseSelect, FormField } from '@/shared/ui'

const props = defineProps<{ modelValue: boolean; consultation?: Consultation | null; saving?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [values: ConsultationFormValues]
}>()

const { options: patientOptions } = usePatientOptions()
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Finalized', value: 'finalized' },
] as const

const { defineField, handleSubmit, errors, resetForm } = useForm<ConsultationFormValues>({
  validationSchema: toTypedSchema(consultationSchema),
  initialValues: { status: 'draft', symptoms: [], vitals: {} },
})

const [patientId] = defineField('patientId')
const [consultedAt, consultedAttrs] = defineField('consultedAt')
const [chiefComplaint, chiefAttrs] = defineField('chiefComplaint')
const [diagnosis, diagnosisAttrs] = defineField('diagnosis')
const [clinicalNotes, notesAttrs] = defineField('clinicalNotes')
const [status] = defineField('status')
const [bloodPressure, bpAttrs] = defineField('vitals.bloodPressure')
const [heartRate, hrAttrs] = defineField('vitals.heartRate')
const [temperature, tempAttrs] = defineField('vitals.temperature')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.consultation) {
      const c = props.consultation
      resetForm({
        values: {
          patientId: c.patientId,
          consultedAt: c.consultedAt.slice(0, 10),
          chiefComplaint: c.chiefComplaint ?? '',
          diagnosis: c.diagnosis ?? '',
          symptoms: c.symptoms,
          clinicalNotes: c.clinicalNotes ?? '',
          status: c.status,
          vitals: c.vitals,
        },
      })
    } else {
      resetForm({
        values: { status: 'draft', symptoms: [], vitals: {}, consultedAt: new Date().toISOString().slice(0, 10) },
      })
    }
  },
)

const onSubmit = handleSubmit((values) =>
  emit('submit', { ...values, consultedAt: new Date(values.consultedAt).toISOString() }),
)
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="consultation ? 'Edit consultation' : 'New consultation'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="consultation-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit="onSubmit">
      <FormField label="Patient" :error="errors.patientId" required>
        <BaseSelect v-model="patientId" :options="patientOptions" placeholder="Select a patient" :invalid="!!errors.patientId" />
      </FormField>
      <FormField label="Date" :error="errors.consultedAt" required>
        <BaseInput v-model="consultedAt" v-bind="consultedAttrs" type="date" :invalid="!!errors.consultedAt" />
      </FormField>
      <FormField class="sm:col-span-2" label="Chief complaint" :error="errors.chiefComplaint">
        <BaseInput v-model="chiefComplaint" v-bind="chiefAttrs" />
      </FormField>
      <FormField class="sm:col-span-2" label="Diagnosis" :error="errors.diagnosis">
        <BaseInput v-model="diagnosis" v-bind="diagnosisAttrs" />
      </FormField>
      <FormField label="Blood pressure"><BaseInput v-model="bloodPressure" v-bind="bpAttrs" placeholder="120/80" /></FormField>
      <FormField label="Heart rate"><BaseInput v-model="heartRate" v-bind="hrAttrs" placeholder="72 bpm" /></FormField>
      <FormField label="Temperature"><BaseInput v-model="temperature" v-bind="tempAttrs" placeholder="37°C" /></FormField>
      <FormField label="Status">
        <BaseSelect v-model="status" :options="statusOptions" :placeholder="undefined" />
      </FormField>
      <FormField class="sm:col-span-2" label="Clinical notes" :error="errors.clinicalNotes">
        <textarea
          v-model="clinicalNotes"
          v-bind="notesAttrs"
          rows="4"
          class="w-full rounded-xl border border-surface-border px-3.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </FormField>
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="emit('update:modelValue', false)">Cancel</BaseButton>
        <BaseButton type="submit" form="consultation-form" :loading="saving">Save consultation</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
