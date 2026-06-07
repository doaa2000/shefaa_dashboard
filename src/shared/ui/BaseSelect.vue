<script setup lang="ts" generic="T extends string | number">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'

interface Option<V> {
  label: string
  value: V
}

const props = withDefaults(
  defineProps<{
    modelValue: T | null | undefined
    options: Option<T>[]
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
    id?: string
  }>(),
  { disabled: false, invalid: false, placeholder: 'Select…' },
)

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const classes = computed(() =>
  cn(
    'w-full rounded-xl border bg-white px-3.5 h-10 text-sm text-slate-800 transition-colors',
    'focus:outline-none focus:ring-2',
    props.invalid
      ? 'border-red-400 focus:ring-red-300'
      : 'border-surface-border focus:border-primary-400 focus:ring-primary-200',
    props.disabled && 'cursor-not-allowed bg-slate-50 opacity-70',
  ),
)

function onChange(event: Event) {
  const raw = (event.target as HTMLSelectElement).value
  const match = props.options.find((o) => String(o.value) === raw)
  if (match) emit('update:modelValue', match.value)
}
</script>

<template>
  <select :id="id" :class="classes" :disabled="disabled" @change="onChange">
    <option v-if="placeholder" value="" disabled :selected="modelValue == null">{{ placeholder }}</option>
    <option v-for="opt in options" :key="String(opt.value)" :value="opt.value" :selected="opt.value === modelValue">
      {{ opt.label }}
    </option>
  </select>
</template>
