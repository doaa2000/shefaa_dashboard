<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { appointmentSchema, type AppointmentFormValues } from '../../domain/appointment.schema'
import { statusOptions } from '../../domain/appointment.labels'
import { sessionOptions } from '@/features/settings/domain/schedule.models'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { Appointment } from '../../domain/appointment.models'
import { usePatientOptions } from '@/features/patients/application/usePatientOptions'
import { BaseButton, BaseInput, BaseModal, BaseSelect, FormField } from '@/shared/ui'

const props = defineProps<{ modelValue: boolean; appointment?: Appointment | null; saving?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [values: AppointmentFormValues]
}>()

const { options: patientOptions } = usePatientOptions()
const { t } = useI18n()
const auth = useAuthStore()

const statuses = computed(() => statusOptions())
const sessions = computed(() => sessionOptions())
const methods = computed(() => [
  { label: t('method.cash'), value: 'cash' },
  { label: t('method.instapay'), value: 'instapay' },
  { label: t('method.card'), value: 'card' },
])

// Shown as the placeholder rather than filled in: a number already in the box
// is a number the doctor has to think about, and nine times in ten the answer
// is "whatever I normally charge".
const feePlaceholder = computed(() =>
  auth.profile?.consultationFee != null ? String(auth.profile.consultationFee) : '',
)

const { defineField, handleSubmit, errors, resetForm } = useForm<AppointmentFormValues>({
  // A computed schema, so the messages follow a language change instead of
  // staying in whichever one the form was opened in.
  validationSchema: computed(() => toTypedSchema(appointmentSchema())),
  initialValues: { status: 'pending', paymentMethod: 'cash', paid: false },
})

const [patientId] = defineField('patientId')
const [bookedDate, dateAttrs] = defineField('bookedDate')
const [session] = defineField('session')
const [startTime, startAttrs] = defineField('startTime')
const [endTime, endAttrs] = defineField('endTime')
const [status] = defineField('status')
const [amount, amountAttrs] = defineField('amount')
const [paymentMethod] = defineField('paymentMethod')
const [paid, paidAttrs] = defineField('paid')

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
          session: a.session === 'evening' ? 'evening' : 'morning',
          startTime: a.startTime?.slice(0, 5),
          endTime: a.endTime?.slice(0, 5),
          status: a.status,
          paymentMethod: 'cash',
          paid: false,
        },
      })
    } else {
      resetForm({
        values: {
          status: 'confirmed',
          session: 'morning',
          bookedDate: new Date().toISOString().slice(0, 10),
          paymentMethod: 'cash',
          paid: false,
        },
      })
    }
  },
)

const onSubmit = handleSubmit((values) => emit('submit', values))
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="t(appointment ? 'appointments.modal.editTitle' : 'appointments.modal.newTitle')"
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
        <BaseInput v-model="startTime" v-bind="startAttrs" type="time" :invalid="!!errors.startTime" />
      </FormField>
      <FormField :label="t('appointments.modal.endTime')" :error="errors.endTime" required>
        <BaseInput v-model="endTime" v-bind="endAttrs" type="time" :invalid="!!errors.endTime" />
      </FormField>

      <!-- Only when creating. Editing an appointment must not quietly rewrite
           what it cost; that belongs on the payments page, where the change is
           recorded against whoever made it. -->
      <template v-if="!appointment">
        <FormField
          :label="t('appointments.modal.fee')"
          :error="errors.amount"
          :hint="t('appointments.modal.feeHint')"
        >
          <BaseInput
            v-model="amount"
            v-bind="amountAttrs"
            type="number"
            min="0"
            :placeholder="feePlaceholder"
            :invalid="!!errors.amount"
          />
        </FormField>
        <FormField :label="t('appointments.modal.method')">
          <BaseSelect v-model="paymentMethod" :options="methods" :placeholder="undefined" />
        </FormField>
        <label class="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input
            v-model="paid"
            v-bind="paidAttrs"
            type="checkbox"
            class="h-4 w-4 rounded border-surface-border text-primary-600"
          />
          {{ t('appointments.modal.paidNow') }}
        </label>
        <p class="text-xs text-slate-500 sm:col-span-2">
          {{ t('appointments.modal.feeNote') }}
        </p>
      </template>
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
