<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import { forgotPasswordSchema } from '../../domain/auth.schema'
import AuthCard from '../components/AuthCard.vue'
import { BaseButton, BaseInput, FormField } from '@/shared/ui'
import { useToast } from '@/shared/composables/useToast'

const toast = useToast()
const submitting = ref(false)
const sent = ref(false)

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(forgotPasswordSchema),
})
const [email, emailAttrs] = defineField('email')

const onSubmit = handleSubmit(async (values) => {
  submitting.value = true
  const result = await container.authService.requestPasswordReset(values.email)
  submitting.value = false
  if (isOk(result)) {
    sent.value = true
    toast.success('Check your inbox', 'We sent you a reset link.')
  } else {
    toast.error('Could not send reset link', result.error.message)
  }
})
</script>

<template>
  <AuthCard title="Reset your password" subtitle="We'll email you a secure reset link">
    <div v-if="sent" class="text-center text-sm text-slate-600">
      <p>If an account exists for that email, a reset link is on its way.</p>
      <RouterLink to="/login" class="mt-4 inline-block font-medium text-primary-600 hover:underline">
        Back to sign in
      </RouterLink>
    </div>
    <form v-else class="space-y-4" @submit="onSubmit">
      <FormField label="Email" for="email" :error="errors.email" required>
        <BaseInput id="email" v-model="email" v-bind="emailAttrs" type="email" placeholder="doctor@clinic.com" :invalid="!!errors.email" />
      </FormField>
      <BaseButton type="submit" block :loading="submitting">Send reset link</BaseButton>
      <RouterLink to="/login" class="block text-center text-sm font-medium text-primary-600 hover:underline">
        Back to sign in
      </RouterLink>
    </form>
  </AuthCard>
</template>
