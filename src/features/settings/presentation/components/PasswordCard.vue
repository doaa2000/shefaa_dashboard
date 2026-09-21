<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { BaseButton, BaseCard } from '@/shared/ui'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <BaseCard :title="t('settings.passwordTitle')" :subtitle="t('settings.passwordSubtitle')">
    <!-- The change itself lives on its own screen because the doctor is also
         sent there on first sign-in, and one screen for both means the form
         they are forced through is the one they already know. -->
    <BaseButton variant="outline" @click="router.push('/change-password')">
      {{ t('settings.changePassword') }}
    </BaseButton>
  </BaseCard>
</template>
