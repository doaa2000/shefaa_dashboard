<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined
    type?: string
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
    id?: string
  }>(),
  { type: 'text', disabled: false, invalid: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const classes = computed(() =>
  cn(
    'w-full rounded-xl border bg-white px-3.5 h-10 text-sm text-slate-800 transition-colors',
    'placeholder:text-slate-400 focus:outline-none focus:ring-2',
    props.invalid
      ? 'border-red-400 focus:ring-red-300'
      : 'border-surface-border focus:border-primary-400 focus:ring-primary-200',
    props.disabled && 'cursor-not-allowed bg-slate-50 opacity-70',
  ),
)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    :id="id"
    :type="type"
    :value="modelValue ?? ''"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="classes"
    :aria-invalid="invalid"
    @input="onInput"
  />
</template>
