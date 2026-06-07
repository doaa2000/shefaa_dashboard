<script setup lang="ts">
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'

const props = withDefaults(
  defineProps<{ modelValue: boolean; title?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }>(),
  { size: 'md' },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

function close() {
  emit('update:modelValue', false)
}

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) close()
})

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="close" />
        <div :class="['relative w-full rounded-2xl bg-white shadow-elevated', sizes[size]]">
          <header
            v-if="title || $slots.header"
            class="flex items-center justify-between border-b border-surface-border px-5 py-4"
          >
            <slot name="header">
              <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
            </slot>
            <button class="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close" @click="close">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </header>
          <div class="px-5 py-4"><slot /></div>
          <footer v-if="$slots.footer" class="border-t border-surface-border px-5 py-4">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
