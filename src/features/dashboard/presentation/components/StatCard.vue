<script setup lang="ts">
defineProps<{ label: string; value: number | string; tone?: 'primary' | 'accent' | 'amber' | 'emerald' }>()
const toneMap = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-accent-50 text-accent-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}
</script>

<template>
  <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-slate-500">{{ label }}</p>
      <span :class="['flex h-9 w-9 items-center justify-center rounded-xl', toneMap[tone ?? 'primary']]">
        <slot name="icon">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h10" />
          </svg>
        </slot>
      </span>
    </div>
    <p class="mt-3 text-2xl font-semibold text-slate-900">{{ value }}</p>
  </div>
</template>
