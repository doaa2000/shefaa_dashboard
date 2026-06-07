<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { patientSchema, type PatientFormValues } from '../../domain/patient.schema'
import type { Patient } from '../../domain/patient.models'
import { BaseButton, BaseInput, BaseModal, BaseSelect, FormField } from '@/shared/ui'

const props = defineProps<{ modelValue: boolean; patient?: Patient | null; saving?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [values: PatientFormValues]
}>()

const genderOptions = [
  { label: 'Unspecified', value: 'unspecified' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
] as const

const { defineField, handleSubmit, errors, resetForm } = useForm<PatientFormValues>({
  validationSchema: toTypedSchema(patientSchema),
  initialValues: { gender: 'unspecified', allergies: [] },
})

const [fullName, fullNameAttrs] = defineField('fullName')
const [email, emailAttrs] = defineField('email')
const [phone, phoneAttrs] = defineField('phone')
const [dateOfBirth, dobAttrs] = defineField('dateOfBirth')
const [gender] = defineField('gender')
const [bloodType, bloodAttrs] = defineField('bloodType')
const [address, addressAttrs] = defineField('address')
const [medicalHistory, historyAttrs] = defineField('medicalHistory')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.patient) {
      resetForm({
        values: {
          fullName: props.patient.fullName,
          email: props.patient.email ?? '',
          phone: props.patient.phone ?? '',
          dateOfBirth: props.patient.dateOfBirth ?? '',
          gender: props.patient.gender,
          bloodType: props.patient.bloodType ?? '',
          address: props.patient.address ?? '',
          medicalHistory: props.patient.medicalHistory ?? '',
          allergies: props.patient.allergies,
        },
      })
    } else {
      resetForm({ values: { gender: 'unspecified', allergies: [], fullName: '' } })
    }
  },
)

const onSubmit = handleSubmit((values) => emit('submit', values))
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="patient ? 'Edit patient' : 'Add patient'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="patient-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit="onSubmit">
      <FormField class="sm:col-span-2" label="Full name" :error="errors.fullName" required>
        <BaseInput v-model="fullName" v-bind="fullNameAttrs" :invalid="!!errors.fullName" />
      </FormField>
      <FormField label="Email" :error="errors.email">
        <BaseInput v-model="email" v-bind="emailAttrs" type="email" :invalid="!!errors.email" />
      </FormField>
      <FormField label="Phone" :error="errors.phone">
        <BaseInput v-model="phone" v-bind="phoneAttrs" :invalid="!!errors.phone" />
      </FormField>
      <FormField label="Date of birth" :error="errors.dateOfBirth">
        <BaseInput v-model="dateOfBirth" v-bind="dobAttrs" type="date" />
      </FormField>
      <FormField label="Gender">
        <BaseSelect v-model="gender" :options="genderOptions" :placeholder="undefined" />
      </FormField>
      <FormField label="Blood type" :error="errors.bloodType">
        <BaseInput v-model="bloodType" v-bind="bloodAttrs" placeholder="e.g. O+" />
      </FormField>
      <FormField label="Address" :error="errors.address">
        <BaseInput v-model="address" v-bind="addressAttrs" />
      </FormField>
      <FormField class="sm:col-span-2" label="Medical history" :error="errors.medicalHistory">
        <textarea
          v-model="medicalHistory"
          v-bind="historyAttrs"
          rows="3"
          class="w-full rounded-xl border border-surface-border px-3.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </FormField>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="emit('update:modelValue', false)">Cancel</BaseButton>
        <BaseButton type="submit" form="patient-form" :loading="saving">Save patient</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
