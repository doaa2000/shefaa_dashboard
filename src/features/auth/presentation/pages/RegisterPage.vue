<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useAuthStore } from '../../store/auth.store'
import { registerSchema } from '../../domain/auth.schema'
import AuthCard from '../components/AuthCard.vue'
import { BaseButton, BaseInput, FormField } from '@/shared/ui'
import { useToast } from '@/shared/composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const { defineField, handleSubmit, errors } = useForm({
  // A computed schema, so the messages follow a language change instead of
  // staying in whichever one the form was opened in.
  validationSchema: computed(() => toTypedSchema(registerSchema())),
})
const [fullName, fullNameAttrs] = defineField('fullName')
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmAttrs] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  const success = await auth.register({
    fullName: values.fullName,
    email: values.email,
    password: values.password,
  })
  if (success) {
    toast.success(t('auth.toast.accountCreated'), t('auth.toast.welcome'))
    await router.replace('/')
    return
  }

  // A permission error here does not mean the account was not created -- it
  // means it is not a doctor's yet. Calling that "registration failed" sends
  // someone off to sign up again with the same address, which will not work
  // and will not tell them why.
  if (auth.error?.kind === 'permission') {
    toast.info(t('auth.toast.accountCreated'), auth.error.message)
    await router.replace({ name: 'login' })
    return
  }

  if (auth.error) toast.error(t('auth.toast.registrationFailed'), auth.error.message)
})
</script>

<template>
  <AuthCard :title="t('auth.createTitle')" :subtitle="t('auth.createSubtitle')">
    <form class="space-y-4" @submit="onSubmit">
      <FormField :label="t('auth.fullName')" for="fullName" :error="errors.fullName" required>
        <BaseInput id="fullName" v-model="fullName" v-bind="fullNameAttrs" :placeholder="t('auth.namePlaceholder')" :invalid="!!errors.fullName" />
      </FormField>
      <FormField :label="t('auth.email')" for="email" :error="errors.email" required>
        <BaseInput id="email" v-model="email" v-bind="emailAttrs" type="email" :placeholder="t('auth.emailPlaceholder')" :invalid="!!errors.email" />
      </FormField>
      <FormField :label="t('auth.password')" for="password" :error="errors.password" required>
        <BaseInput id="password" v-model="password" v-bind="passwordAttrs" type="password" placeholder="••••••••" :invalid="!!errors.password" />
      </FormField>
      <FormField :label="t('auth.confirmPassword')" for="confirmPassword" :error="errors.confirmPassword" required>
        <BaseInput id="confirmPassword" v-model="confirmPassword" v-bind="confirmAttrs" type="password" placeholder="••••••••" :invalid="!!errors.confirmPassword" />
      </FormField>
      <BaseButton type="submit" block :loading="auth.loading">{{ t('auth.createAccount') }}</BaseButton>
    </form>
    <p class="mt-6 text-center text-sm text-slate-500">
      {{ t('auth.haveAccount') }}
      <RouterLink to="/login" class="font-medium text-primary-600 hover:underline">
        {{ t('auth.signIn') }}
      </RouterLink>
    </p>
  </AuthCard>
</template>
