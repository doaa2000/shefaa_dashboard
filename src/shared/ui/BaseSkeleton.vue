<script setup lang="ts">
withDefaults(defineProps<{ rows?: number; height?: string }>(), { rows: 1, height: 'h-4' })
</script>

<template>
  <div class="space-y-2.5">
    <div
      v-for="n in rows"
      :key="n"
      :class="['animate-pulse rounded-lg bg-slate-100', height]"
      :style="{ width: n === rows && rows > 1 ? '70%' : '100%' }"
    />
  </div>
</template>
