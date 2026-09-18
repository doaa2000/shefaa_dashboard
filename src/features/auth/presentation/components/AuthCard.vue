<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="w-full max-w-md rounded-2xl border border-surface-border bg-white p-8 shadow-elevated">
    <div class="mb-6 text-center">
      <!-- Was a plus sign, which is every medical product. This is ours. -->
      <img src="/logo.png" alt="" class="mx-auto mb-4 h-20 w-auto" />
      <h1 class="text-xl font-semibold text-slate-900">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
    </div>
    <slot />
  </div>
</template>
