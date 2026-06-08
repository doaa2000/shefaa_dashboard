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
  initialValues: { name: '' },
})

const [name, nameAttrs] = defineField('name')
const [title, titleAttrs] = defineField('title')
const [specialization, specAttrs] = defineField('specialization')
const [phone, phoneAttrs] = defineField('phone')
const [licenseNumber, licenseAttrs] = defineField('licenseNumber')
const [location, locationAttrs] = defineField('location')
const [consultationFee, feeAttrs] = defineField('consultationFee')
const [bio, bioAttrs] = defineField('bio')

watch(
  profile,
  (p) => {
    if (!p) return
    resetForm({
      values: {
        name: p.name,
        title: p.title ?? '',
        specialization: p.specialization ?? '',
        phone: p.phone ?? '',
        licenseNumber: p.licenseNumber ?? '',
        location: p.location ?? '',
        consultationFee: p.consultationFee ?? null,
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
      <FormField label="Name" :error="errors.name" required>
        <BaseInput v-model="name" v-bind="nameAttrs" :invalid="!!errors.name" />
      </FormField>
      <FormField label="Title" :error="errors.title">
        <BaseInput v-model="title" v-bind="titleAttrs" placeholder="e.g. Consultant" />
      </FormField>
      <FormField label="Specialization" :error="errors.specialization">
        <BaseInput v-model="specialization" v-bind="specAttrs" />
      </FormField>
      <FormField label="Phone" :error="errors.phone">
        <BaseInput v-model="phone" v-bind="phoneAttrs" />
      </FormField>
      <FormField label="License number" :error="errors.licenseNumber">
        <BaseInput v-model="licenseNumber" v-bind="licenseAttrs" />
      </FormField>
      <FormField label="Location" :error="errors.location">
        <BaseInput v-model="location" v-bind="locationAttrs" />
      </FormField>
      <FormField label="Consultation fee" :error="errors.consultationFee">
        <BaseInput v-model="consultationFee" v-bind="feeAttrs" type="number" />
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
