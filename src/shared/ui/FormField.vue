<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    error?: string
    hint?: string
    required?: boolean
    for?: string
  }>(),
  { required: false },
)
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="$props.for" class="block text-sm font-medium text-slate-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>
