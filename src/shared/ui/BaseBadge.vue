<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

const props = withDefaults(defineProps<{ tone?: Tone }>(), { tone: 'neutral' })

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  primary: 'bg-primary-100 text-primary-700',
}

const classes = computed(() =>
  cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[props.tone]),
)
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
