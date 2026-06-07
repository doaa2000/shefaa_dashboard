<script setup lang="ts">
import { watch } from 'vue'
import { useFieldArray, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { prescriptionSchema, type PrescriptionFormValues } from '../../domain/prescription.schema'
import type { Prescription } from '../../domain/prescription.models'
import { usePatientOptions } from '@/features/patients/application/usePatientOptions'
import { BaseButton, BaseInput, BaseModal, BaseSelect, FormField } from '@/shared/ui'

const props = defineProps<{ modelValue: boolean; prescription?: Prescription | null; saving?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [values: PrescriptionFormValues]
}>()

const { options: patientOptions } = usePatientOptions()
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

const emptyItem = { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }

const { defineField, handleSubmit, errors, resetForm } = useForm<PrescriptionFormValues>({
  validationSchema: toTypedSchema(prescriptionSchema),
  initialValues: { status: 'active', items: [{ ...emptyItem }] },
})

const [patientId] = defineField('patientId')
const [issuedAt, issuedAttrs] = defineField('issuedAt')
const [status] = defineField('status')
const [notes, notesAttrs] = defineField('notes')
const { fields, push, remove } = useFieldArray<PrescriptionFormValues['items'][number]>('items')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (props.prescription) {
      const p = props.prescription
      resetForm({
        values: {
          patientId: p.patientId,
          issuedAt: p.issuedAt.slice(0, 10),
          status: p.status,
          notes: p.notes ?? '',
          items: p.items.length
            ? p.items.map((it) => ({
                medicationName: it.medicationName,
                dosage: it.dosage ?? '',
                frequency: it.frequency ?? '',
                duration: it.duration ?? '',
                instructions: it.instructions ?? '',
              }))
            : [{ ...emptyItem }],
        },
      })
    } else {
      resetForm({
        values: {
          status: 'active',
          items: [{ ...emptyItem }],
          issuedAt: new Date().toISOString().slice(0, 10),
        },
      })
    }
  },
)

const onSubmit = handleSubmit((values) =>
  emit('submit', { ...values, issuedAt: new Date(values.issuedAt).toISOString() }),
)
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="prescription ? 'Edit prescription' : 'New prescription'"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="prescription-form" class="space-y-4" @submit="onSubmit">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Patient" :error="errors.patientId" required>
          <BaseSelect v-model="patientId" :options="patientOptions" placeholder="Select a patient" :invalid="!!errors.patientId" />
        </FormField>
        <FormField label="Issue date" :error="errors.issuedAt" required>
          <BaseInput v-model="issuedAt" v-bind="issuedAttrs" type="date" :invalid="!!errors.issuedAt" />
        </FormField>
        <FormField label="Status">
          <BaseSelect v-model="status" :options="statusOptions" :placeholder="undefined" />
        </FormField>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-slate-700">Medications</h4>
          <BaseButton size="sm" variant="secondary" @click="push({ ...emptyItem })">+ Add medication</BaseButton>
        </div>
        <p v-if="typeof errors.items === 'string'" class="mb-2 text-xs text-red-500">{{ errors.items }}</p>

        <div
          v-for="(field, index) in fields"
          :key="field.key"
          class="mb-3 grid grid-cols-1 gap-3 rounded-xl border border-surface-border p-3 sm:grid-cols-12"
        >
          <FormField class="sm:col-span-4" label="Medication" :error="errors[`items[${index}].medicationName` as keyof typeof errors] as string">
            <BaseInput v-model="field.value.medicationName" placeholder="e.g. Amoxicillin" />
          </FormField>
          <FormField class="sm:col-span-2" label="Dosage">
            <BaseInput v-model="field.value.dosage" placeholder="500mg" />
          </FormField>
          <FormField class="sm:col-span-2" label="Frequency">
            <BaseInput v-model="field.value.frequency" placeholder="2x/day" />
          </FormField>
          <FormField class="sm:col-span-2" label="Duration">
            <BaseInput v-model="field.value.duration" placeholder="7 days" />
          </FormField>
          <div class="flex items-end sm:col-span-2">
            <BaseButton size="sm" variant="danger" :disabled="fields.length === 1" @click="remove(index)">
              Remove
            </BaseButton>
          </div>
          <FormField class="sm:col-span-12" label="Instructions">
            <BaseInput v-model="field.value.instructions" placeholder="After meals" />
          </FormField>
        </div>
      </div>

      <FormField label="Notes" :error="errors.notes">
        <textarea
          v-model="notes"
          v-bind="notesAttrs"
          rows="2"
          class="w-full rounded-xl border border-surface-border px-3.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </FormField>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" @click="emit('update:modelValue', false)">Cancel</BaseButton>
        <BaseButton type="submit" form="prescription-form" :loading="saving">Save prescription</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
