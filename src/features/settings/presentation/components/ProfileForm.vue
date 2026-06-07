<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { profileSchema, type ProfileFormValues } from '../../domain/schedule.schema'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useToast } from '@/shared/composables/useToast'
import { BaseButton, BaseCard, BaseInput, FormField } from '@/shared/ui'

const auth = useAuthStore()
const toast = useToast()
const { profile, loading } = storeToRefs(auth)

const { defineField, handleSubmit, errors, resetForm } = useForm<ProfileFormValues>({
  validationSchema: toTypedSchema(profileSchema),
  initialValues: { timezone: 'UTC' },
})

const [fullName, fullNameAttrs] = defineField('fullName')
const [phone, phoneAttrs] = defineField('phone')
const [specialty, specialtyAttrs] = defineField('specialty')
const [licenseNumber, licenseAttrs] = defineField('licenseNumber')
const [clinicName, clinicAttrs] = defineField('clinicName')
const [timezone, timezoneAttrs] = defineField('timezone')
const [bio, bioAttrs] = defineField('bio')

watch(
  profile,
  (p) => {
    if (!p) return
    resetForm({
      values: {
        fullName: p.fullName,
        phone: p.phone ?? '',
        specialty: p.specialty ?? '',
        licenseNumber: p.licenseNumber ?? '',
        clinicName: p.clinicName ?? '',
        timezone: p.timezone,
        bio: p.bio ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  const ok = await auth.updateProfile(values)
  if (ok) toast.success('Profile saved')
  else if (auth.error) toast.error('Could not save profile', auth.error.message)
})
</script>

<template>
  <BaseCard title="Profile" subtitle="Your professional details">
    <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit="onSubmit">
      <FormField label="Full name" :error="errors.fullName" required>
        <BaseInput v-model="fullName" v-bind="fullNameAttrs" :invalid="!!errors.fullName" />
      </FormField>
      <FormField label="Phone" :error="errors.phone">
        <BaseInput v-model="phone" v-bind="phoneAttrs" />
      </FormField>
      <FormField label="Specialty" :error="errors.specialty">
        <BaseInput v-model="specialty" v-bind="specialtyAttrs" />
      </FormField>
      <FormField label="License number" :error="errors.licenseNumber">
        <BaseInput v-model="licenseNumber" v-bind="licenseAttrs" />
      </FormField>
      <FormField label="Clinic name" :error="errors.clinicName">
        <BaseInput v-model="clinicName" v-bind="clinicAttrs" />
      </FormField>
      <FormField label="Timezone" :error="errors.timezone">
        <BaseInput v-model="timezone" v-bind="timezoneAttrs" />
      </FormField>
      <FormField class="sm:col-span-2" label="Bio" :error="errors.bio">
        <textarea
          v-model="bio"
          v-bind="bioAttrs"
          rows="3"
          class="w-full rounded-xl border border-surface-border px-3.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </FormField>
      <div class="sm:col-span-2">
        <BaseButton type="submit" :loading="loading">Save profile</BaseButton>
      </div>
    </form>
  </BaseCard>
</template>
