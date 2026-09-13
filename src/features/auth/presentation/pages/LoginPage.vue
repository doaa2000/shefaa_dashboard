<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useAuthStore } from '../../store/auth.store'
import { loginSchema } from '../../domain/auth.schema'
import AuthCard from '../components/AuthCard.vue'
import { BaseButton, BaseInput, FormField } from '@/shared/ui'
import { useToast } from '@/shared/composables/useToast'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const { defineField, handleSubmit, errors } = useForm({
  // A computed schema, so the messages follow a language change instead of
  // staying in whichever one the form was opened in.
  validationSchema: computed(() => toTypedSchema(loginSchema())),
})
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  const success = await auth.signIn(values)
  if (success) {
    const redirect = (route.query.redirect as string) || '/'
    await router.replace(redirect)
    return
  }

  // An account that is not a doctor's is turned away, not failed: the password
  // was right. The message from the store says what to do about it.
  if (auth.error?.kind === 'permission') {
    toast.info(t('auth.toast.doctorsOnly'), auth.error.message)
    return
  }

  toast.error(
    t('auth.toast.signInFailed'),
    auth.error?.message ?? t('auth.toast.invalidCredentials'),
  )
})
</script>

<template>
  <AuthCard :title="t('auth.welcomeBack')" :subtitle="t('auth.signInSubtitle')">
    <form class="space-y-4" @submit="onSubmit">
      <FormField :label="t('auth.email')" for="email" :error="errors.email" required>
        <BaseInput
          id="email"
          v-model="email"
          v-bind="emailAttrs"
          type="email"
          :placeholder="t('auth.emailPlaceholder')"
          :invalid="!!errors.email"
        />
      </FormField>

      <FormField :label="t('auth.password')" for="password" :error="errors.password" required>
        <BaseInput
          id="password"
          v-model="password"
          v-bind="passwordAttrs"
          type="password"
          placeholder="••••••••"
          :invalid="!!errors.password"
        />
      </FormField>

      <div class="flex justify-end">
        <RouterLink to="/forgot-password" class="text-sm font-medium text-primary-600 hover:underline">
          {{ t('auth.forgotPassword') }}
        </RouterLink>
      </div>

      <BaseButton type="submit" block :loading="auth.loading">{{ t('auth.signIn') }}</BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      {{ t('auth.noAccount') }}
      <RouterLink to="/register" class="font-medium text-primary-600 hover:underline">
        {{ t('auth.createOne') }}
      </RouterLink>
    </p>
  </AuthCard>
</template>
