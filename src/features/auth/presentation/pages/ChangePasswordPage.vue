<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../store/auth.store'
import AuthCard from '../components/AuthCard.vue'
import { BaseButton, BaseInput, FormField } from '@/shared/ui'
import { useToast } from '@/shared/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { t } = useI18n()

const password = ref('')
const confirmation = ref('')
const submitting = ref(false)

/**
 * Whether the doctor is here because they must be, or because they chose to.
 *
 * The first is somebody who has just been handed a password and cannot reach
 * the rest of the dashboard yet; the second is somebody visiting from
 * settings. Same form, different thing to say, and only the second gets a way
 * out.
 */
const forced = computed(() => auth.mustChangePassword)

const tooShort = computed(() => password.value.length > 0 && password.value.length < 8)
const mismatch = computed(() => confirmation.value.length > 0 && confirmation.value !== password.value)
const canSubmit = computed(
  () => password.value.length >= 8 && confirmation.value === password.value && !submitting.value,
)

async function onSubmit(): Promise<void> {
  if (!canSubmit.value) return
  submitting.value = true
  const changed = await auth.changePassword(password.value, confirmation.value)
  submitting.value = false

  if (!changed) {
    toast.error(t('auth.changeFailed'), auth.error?.message ?? '')
    return
  }

  toast.success(t('auth.changed'), t('auth.changedBody'))
  const next = (route.query.redirect as string) || '/'
  await router.replace(next)
}
</script>

<template>
  <AuthCard
    :title="forced ? t('auth.chooseTitle') : t('auth.changeTitle')"
    :subtitle="forced ? t('auth.chooseSubtitle') : t('auth.changeSubtitle')"
  >
    <form class="space-y-4" @submit.prevent="onSubmit">
      <FormField
        :label="t('auth.newPassword')"
        :error="tooShort ? t('auth.tooShort') : undefined"
        :hint="t('auth.passwordHint')"
      >
        <BaseInput
          id="new-password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          :invalid="tooShort"
        />
      </FormField>

      <FormField
        :label="t('auth.confirmPassword')"
        :error="mismatch ? t('auth.mismatch') : undefined"
      >
        <BaseInput
          id="confirm-password"
          v-model="confirmation"
          type="password"
          autocomplete="new-password"
          :invalid="mismatch"
        />
      </FormField>

      <BaseButton type="submit" block :loading="submitting" :disabled="!canSubmit">
        {{ t('auth.savePassword') }}
      </BaseButton>

      <!-- Only for somebody who came here by choice. The other kind has
           nowhere to go back to yet. -->
      <p v-if="!forced" class="text-center text-sm">
        <RouterLink to="/" class="font-medium text-primary-900 hover:underline">
          {{ t('common.cancel') }}
        </RouterLink>
      </p>
    </form>
  </AuthCard>
</template>
