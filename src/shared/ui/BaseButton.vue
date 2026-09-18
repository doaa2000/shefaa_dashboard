<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', loading: false, disabled: false, block: false },
)

defineEmits<{ click: [event: MouseEvent] }>()

// The brand colour fills it, and hover goes a step darker down the same ramp.
// Fading the alpha instead, the way the patient app's CustomButton does, lands
// the hover between the button and the page behind it -- on a white card that
// reads as the button losing interest rather than answering the pointer.
//
// The ring is the one exception to the ramp. It is the keyboard focus outline,
// and an outline the colour of the button it surrounds is not an outline.
const variants: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-900',
  secondary: 'bg-primary-50 text-primary-900 hover:bg-primary-200 focus-visible:ring-primary-900',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  outline: 'border border-surface-border bg-white text-slate-700 hover:bg-primary-50 focus-visible:ring-primary-900',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

const classes = computed(() =>
  cn(
    'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variants[props.variant],
    sizes[props.size],
    props.block && 'w-full',
  ),
)
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading" @click="$emit('click', $event)">
    <svg v-if="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot v-if="$slots.icon && !loading" name="icon" />
    <slot />
  </button>
</template>
