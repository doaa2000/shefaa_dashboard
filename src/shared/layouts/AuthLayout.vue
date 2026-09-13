<script setup lang="ts">
import LanguageToggle from '@/shared/components/LanguageToggle.vue'
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-surface-muted to-accent-50 px-4 py-10">
    <!-- Here as well as in the topbar: somebody who cannot read the sign-in
         page cannot reach the topbar to change it. -->
    <div class="absolute end-4 top-4">
      <LanguageToggle />
    </div>
    <slot />
  </div>
</template>
