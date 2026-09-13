<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BaseButton } from '@/shared/ui'

const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
    <p class="text-5xl font-bold text-primary-600">404</p>
    <h1 class="text-lg font-semibold text-slate-800">{{ t('notFound.title') }}</h1>
    <p class="text-sm text-slate-500">{{ t('notFound.body') }}</p>
    <RouterLink to="/">
      <BaseButton>{{ t('notFound.back') }}</BaseButton>
    </RouterLink>
  </div>
</template>
