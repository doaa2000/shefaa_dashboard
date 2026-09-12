<script setup lang="ts">
import { useRouter, useRoute, RouterLink } from 'vue-router'
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

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(loginSchema),
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
    toast.info('This dashboard is for doctors', auth.error.message)
    return
  }

  toast.error('Sign in failed', auth.error?.message ?? 'Invalid email or password.')
})
</script>

<template>
  <AuthCard title="Welcome back" subtitle="Sign in to your Shefaa dashboard">
    <form class="space-y-4" @submit="onSubmit">
      <FormField label="Email" for="email" :error="errors.email" required>
        <BaseInput
          id="email"
          v-model="email"
          v-bind="emailAttrs"
          type="email"
          placeholder="doctor@clinic.com"
          :invalid="!!errors.email"
        />
      </FormField>

      <FormField label="Password" for="password" :error="errors.password" required>
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
          Forgot password?
        </RouterLink>
      </div>

      <BaseButton type="submit" block :loading="auth.loading">Sign in</BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      Don't have an account?
      <RouterLink to="/register" class="font-medium text-primary-600 hover:underline">Create one</RouterLink>
    </p>
  </AuthCard>
</template>
