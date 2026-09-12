<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
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

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(registerSchema),
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
    toast.success('Account created', 'Welcome to Shefaa.')
    await router.replace('/')
    return
  }

  // A permission error here does not mean the account was not created -- it
  // means it is not a doctor's yet. Calling that "registration failed" sends
  // someone off to sign up again with the same address, which will not work
  // and will not tell them why.
  if (auth.error?.kind === 'permission') {
    toast.info('Account created', auth.error.message)
    await router.replace({ name: 'login' })
    return
  }

  if (auth.error) toast.error('Registration failed', auth.error.message)
})
</script>

<template>
  <AuthCard title="Create your account" subtitle="Start managing your practice with Shefaa">
    <form class="space-y-4" @submit="onSubmit">
      <FormField label="Full name" for="fullName" :error="errors.fullName" required>
        <BaseInput id="fullName" v-model="fullName" v-bind="fullNameAttrs" placeholder="Dr. Jane Doe" :invalid="!!errors.fullName" />
      </FormField>
      <FormField label="Email" for="email" :error="errors.email" required>
        <BaseInput id="email" v-model="email" v-bind="emailAttrs" type="email" placeholder="doctor@clinic.com" :invalid="!!errors.email" />
      </FormField>
      <FormField label="Password" for="password" :error="errors.password" required>
        <BaseInput id="password" v-model="password" v-bind="passwordAttrs" type="password" placeholder="••••••••" :invalid="!!errors.password" />
      </FormField>
      <FormField label="Confirm password" for="confirmPassword" :error="errors.confirmPassword" required>
        <BaseInput id="confirmPassword" v-model="confirmPassword" v-bind="confirmAttrs" type="password" placeholder="••••••••" :invalid="!!errors.confirmPassword" />
      </FormField>
      <BaseButton type="submit" block :loading="auth.loading">Create account</BaseButton>
    </form>
    <p class="mt-6 text-center text-sm text-slate-500">
      Already have an account?
      <RouterLink to="/login" class="font-medium text-primary-600 hover:underline">Sign in</RouterLink>
    </p>
  </AuthCard>
</template>
