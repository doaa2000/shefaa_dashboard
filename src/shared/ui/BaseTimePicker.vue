<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/shared/utils/cn'
import { timeLabel } from '@/features/schedule/domain/schedule.models'

/**
 * A time, chosen from a small panel of buttons.
 *
 * The browser's own time input is three boxes to type numbers into, mirrored
 * in Arabic and no help at all; a select of every quarter hour is ninety-six
 * rows to scroll. This is twenty-four hours in a grid and four minute marks
 * under them -- two taps, no typing, and the whole day visible at once.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Times at or before this one cannot be chosen. Used by "to" so it can
     *  never be set before "from". */
    min?: string
    invalid?: boolean
    disabled?: boolean
  }>(),
  { min: '', invalid: false, disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

/** Opened upwards when there is no room below -- these fields sit near the
 *  bottom of a modal, where a panel dropping down leaves the screen. */
const dropUp = ref(false)

function toggle() {
  if (!open.value && root.value) {
    const { bottom } = root.value.getBoundingClientRect()
    // The panel is about 250px tall with its padding.
    dropUp.value = window.innerHeight - bottom < 260
  }
  open.value = !open.value
}

const MINUTES = ['00', '15', '30', '45'] as const

/** Midnight to eleven at night, in the order a clock runs. */
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

const pad = (n: number) => String(n).padStart(2, '0')
const at = (hour: number, minute: string) => `${pad(hour)}:${minute}`

const current = computed(() => {
  const [h, m] = (props.modelValue || '00:00').split(':')
  return { hour: Number(h), minute: m ?? '00' }
})

const label = computed(() => (props.modelValue ? timeLabel(props.modelValue) : '—'))

/** The hour label alone: "9 ص", the way the grid reads. */
function hourLabel(hour: number): string {
  return timeLabel(at(hour, '00')).replace(':00', '').replace('٠٠:', '')
}

const tooEarly = (value: string) => Boolean(props.min) && value <= props.min

/** An hour is out when not one of its four marks can be chosen. */
const hourDisabled = (hour: number) => MINUTES.every((m) => tooEarly(at(hour, m)))

function pickHour(hour: number) {
  if (hourDisabled(hour)) return
  // Keep the minutes where they are, unless that lands before the floor --
  // then take the first mark of this hour that does not.
  const kept = at(hour, current.value.minute)
  const next = tooEarly(kept)
    ? at(hour, MINUTES.find((m) => !tooEarly(at(hour, m))) ?? '00')
    : kept
  emit('update:modelValue', next)
}

function pickMinute(minute: string) {
  const next = at(current.value.hour, minute)
  if (tooEarly(next)) return
  emit('update:modelValue', next)
  open.value = false
}

function onDocumentPointerDown(event: MouseEvent) {
  if (!open.value) return
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      :disabled="disabled"
      :class="
        cn(
          'flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3.5 text-sm text-slate-800 transition-colors',
          'focus:outline-none focus:ring-2',
          invalid
            ? 'border-red-400 focus:ring-red-300'
            : 'border-surface-border focus:border-primary-400 focus:ring-primary-200',
          disabled && 'cursor-not-allowed bg-slate-50 opacity-70',
        )
      "
      @click="toggle"
    >
      <span>{{ label }}</span>
      <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="9" />
        <path stroke-linecap="round" d="M12 7v5l3 2" />
      </svg>
    </button>

    <div
      v-if="open"
      :class="[
        'absolute z-30 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-surface-border bg-white p-3 shadow-elevated',
        dropUp ? 'bottom-full mb-1' : 'mt-1',
      ]"
    >
      <div class="grid grid-cols-4 gap-1">
        <button
          v-for="hour in HOURS"
          :key="hour"
          type="button"
          :disabled="hourDisabled(hour)"
          :class="
            cn(
              'rounded-lg py-1.5 text-sm transition-colors',
              hour === current.hour
                ? 'bg-primary-600 font-medium text-white'
                : 'text-slate-700 hover:bg-primary-50',
              hourDisabled(hour) && 'cursor-not-allowed text-slate-300 hover:bg-transparent',
            )
          "
          @click="pickHour(hour)"
        >
          {{ hourLabel(hour) }}
        </button>
      </div>

      <div class="mt-3 grid grid-cols-4 gap-1 border-t border-surface-border pt-3">
        <button
          v-for="minute in MINUTES"
          :key="minute"
          type="button"
          :disabled="tooEarly(at(current.hour, minute))"
          :class="
            cn(
              'rounded-lg py-1.5 text-sm transition-colors',
              minute === current.minute
                ? 'bg-primary-600 font-medium text-white'
                : 'text-slate-700 hover:bg-primary-50',
              tooEarly(at(current.hour, minute)) &&
                'cursor-not-allowed text-slate-300 hover:bg-transparent',
            )
          "
          @click="pickMinute(minute)"
        >
          :{{ minute }}
        </button>
      </div>
    </div>
  </div>
</template>
