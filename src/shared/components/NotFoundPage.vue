<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BaseButton } from '@/shared/ui'
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
    <p class="text-5xl font-bold text-primary-600">404</p>
    <h1 class="text-lg font-semibold text-slate-800">Page not found</h1>
    <p class="text-sm text-slate-500">The page you're looking for doesn't exist or has moved.</p>
    <RouterLink to="/">
      <BaseButton>Back to dashboard</BaseButton>
    </RouterLink>
  </div>
</template>
