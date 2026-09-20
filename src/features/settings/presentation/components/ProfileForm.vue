<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { profileSchema, type ProfileFormValues } from '../../domain/profile.schema'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useToast } from '@/shared/composables/useToast'
import { BaseButton, BaseCard, BaseInput, FormField } from '@/shared/ui'

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const { profile, loading } = storeToRefs(auth)

const { defineField, handleSubmit, errors, resetForm } = useForm<ProfileFormValues>({
  // A computed schema, so the messages follow a language change instead of
  // staying in whichever one the form was opened in.
  validationSchema: computed(() => toTypedSchema(profileSchema())),
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
  if (ok) toast.success(t('settings.profileSaved'))
  else if (auth.error) toast.error(t('settings.profileSaveFailed'), auth.error.message)
})
</script>

<template>
  <BaseCard :title="t('settings.profile')" :subtitle="t('settings.profileSubtitle')">
    <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit="onSubmit">
      <FormField :label="t('settings.name')" :error="errors.name" required>
        <BaseInput v-model="name" v-bind="nameAttrs" :invalid="!!errors.name" />
      </FormField>
      <FormField :label="t('settings.jobTitle')" :error="errors.title">
        <BaseInput v-model="title" v-bind="titleAttrs" :placeholder="t('settings.jobTitlePlaceholder')" />
      </FormField>
      <FormField :label="t('settings.specialization')" :error="errors.specialization">
        <BaseInput v-model="specialization" v-bind="specAttrs" />
      </FormField>
      <FormField :label="t('settings.phone')" :error="errors.phone">
        <BaseInput v-model="phone" v-bind="phoneAttrs" />
      </FormField>
      <FormField :label="t('settings.licenseNumber')" :error="errors.licenseNumber">
        <BaseInput v-model="licenseNumber" v-bind="licenseAttrs" />
      </FormField>
      <FormField :label="t('settings.location')" :error="errors.location">
        <BaseInput v-model="location" v-bind="locationAttrs" />
      </FormField>
      <FormField :label="t('settings.consultationFee')" :error="errors.consultationFee">
        <BaseInput v-model="consultationFee" v-bind="feeAttrs" type="number" />
      </FormField>
      <FormField class="sm:col-span-2" :label="t('settings.bio')" :error="errors.bio">
        <textarea
          v-model="bio"
          v-bind="bioAttrs"
          rows="3"
          class="w-full rounded-xl border border-surface-border px-3.5 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </FormField>
      <div class="sm:col-span-2">
        <BaseButton type="submit" :loading="loading">{{ t('settings.saveProfile') }}</BaseButton>
      </div>
    </form>
  </BaseCard>
</template>
