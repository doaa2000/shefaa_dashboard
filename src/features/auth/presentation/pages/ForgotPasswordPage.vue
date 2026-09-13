<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import { forgotPasswordSchema } from '../../domain/auth.schema'
import AuthCard from '../components/AuthCard.vue'
import { BaseButton, BaseInput, FormField } from '@/shared/ui'
import { useToast } from '@/shared/composables/useToast'

const toast = useToast()
const { t } = useI18n()
const submitting = ref(false)
const sent = ref(false)

const { defineField, handleSubmit, errors } = useForm({
  // A computed schema, so the messages follow a language change instead of
  // staying in whichever one the form was opened in.
  validationSchema: computed(() => toTypedSchema(forgotPasswordSchema())),
})
const [email, emailAttrs] = defineField('email')

const onSubmit = handleSubmit(async (values) => {
  submitting.value = true
  const result = await container.authService.requestPasswordReset(values.email)
  submitting.value = false
  if (isOk(result)) {
    sent.value = true
    toast.success(t('auth.toast.checkInbox'), t('auth.toast.resetSent'))
  } else {
    toast.error(t('auth.toast.resetFailed'), result.error.message)
  }
})
</script>

<template>
  <AuthCard :title="t('auth.resetTitle')" :subtitle="t('auth.resetSubtitle')">
    <div v-if="sent" class="text-center text-sm text-slate-600">
      <p>{{ t('auth.resetSentBody') }}</p>
      <RouterLink to="/login" class="mt-4 inline-block font-medium text-primary-600 hover:underline">
        {{ t('auth.backToSignIn') }}
      </RouterLink>
    </div>
    <form v-else class="space-y-4" @submit="onSubmit">
      <FormField :label="t('auth.email')" for="email" :error="errors.email" required>
        <BaseInput id="email" v-model="email" v-bind="emailAttrs" type="email" :placeholder="t('auth.emailPlaceholder')" :invalid="!!errors.email" />
      </FormField>
      <BaseButton type="submit" block :loading="submitting">{{ t('auth.sendResetLink') }}</BaseButton>
      <RouterLink to="/login" class="block text-center text-sm font-medium text-primary-600 hover:underline">
        {{ t('auth.backToSignIn') }}
      </RouterLink>
    </form>
  </AuthCard>
</template>
