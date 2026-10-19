<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../store/auth.store'
import { AuthService } from '../../application/auth.service'
import AuthCard from '../components/AuthCard.vue'
import { BaseButton, BaseInput, FormField } from '@/shared/ui'
import { useToast } from '@/shared/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

/**
 * What the emailed link left behind, read once on arrival.
 *
 * By the time this runs the router guard has waited for the auth client to
 * start, and starting is when it trades the link's code for a session and
 * takes the code out of the address. So a session and a clean address mean
 * the link worked. Supabase reports a link it refused in the address itself
 * -- in the query on this flow, in the fragment on older ones -- and a code
 * still sitting there means the trade failed: most often because the link
 * was opened in a different browser from the one that asked for it, which
 * holds the other half of the exchange.
 */
function readLink(): 'ready' | 'expired' | 'invalid' {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const code = query.get('error_code') ?? hash.get('error_code')
  const refused = code ?? query.get('error') ?? hash.get('error')

  // Nothing here needs the parameters any more, and a code or a token has no
  // business sitting in the address bar or in whatever the browser syncs.
  if (window.location.search || window.location.hash) {
    history.replaceState(history.state, '', window.location.pathname)
  }

  if (code === 'otp_expired') return 'expired'
  if (refused || query.has('code')) return 'invalid'
  return auth.isAuthenticated ? 'ready' : 'invalid'
}

const state = ref(readLink())

const min = AuthService.MIN_PASSWORD
const password = ref('')
const confirmation = ref('')
const submitting = ref(false)

const tooShort = computed(() => password.value.length > 0 && password.value.length < min)
const mismatch = computed(
  () => confirmation.value.length > 0 && confirmation.value !== password.value,
)
const canSubmit = computed(
  () => password.value.length >= min && confirmation.value === password.value && !submitting.value,
)

async function onSubmit(): Promise<void> {
  if (!canSubmit.value) return
  submitting.value = true
  const changed = await auth.changePassword(password.value, confirmation.value)
  submitting.value = false

  if (!changed) {
    toast.error(t('auth.changeFailed'), auth.error?.message ?? '')
    // The recovery session can run out while the page sits open. Then the
    // form can never succeed, and the way forward is a new link.
    if (!auth.isAuthenticated) state.value = 'invalid'
    return
  }

  toast.success(t('auth.passwordReset'), t('auth.passwordResetBody'))
  await router.replace('/')
}
</script>

<template>
  <AuthCard
    v-if="state === 'ready'"
    :title="t('auth.newPasswordTitle')"
    :subtitle="t('auth.newPasswordSubtitle')"
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
    </form>
  </AuthCard>

  <AuthCard
    v-else
    :title="state === 'expired' ? t('auth.linkExpiredTitle') : t('auth.linkInvalidTitle')"
  >
    <div class="space-y-4 text-center text-sm text-slate-600">
      <p>{{ state === 'expired' ? t('auth.linkExpiredBody') : t('auth.linkInvalidBody') }}</p>
      <BaseButton block @click="router.push({ name: 'forgot-password' })">
        {{ t('auth.requestNewLink') }}
      </BaseButton>
      <RouterLink
        :to="{ name: 'login' }"
        class="inline-block font-medium text-primary-600 hover:underline"
      >
        {{ t('auth.backToSignIn') }}
      </RouterLink>
    </div>
  </AuthCard>
</template>
