<script setup lang="ts">
import { computed } from 'vue'
import { initials } from '@/shared/utils/formatters'

const props = withDefaults(
  defineProps<{ name?: string | null; src?: string | null; size?: 'sm' | 'md' | 'lg' }>(),
  { size: 'md' },
)

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }
const label = computed(() => initials(props.name))
</script>

<template>
  <span
    :class="[
      'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-700',
      sizes[size],
    ]"
  >
    <img v-if="src" :src="src" :alt="name ?? ''" class="h-full w-full object-cover" />
    <template v-else>{{ label }}</template>
  </span>
</template>
