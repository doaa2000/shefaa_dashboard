<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useToast, type ToastVariant } from '@/shared/composables/useToast'

const { toasts, dismiss } = useToast()
const { t } = useI18n()

const tones: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
}
</script>

<template>
  <div class="pointer-events-none fixed bottom-4 end-4 z-[60] flex w-full max-w-sm flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        :class="['pointer-events-auto rounded-xl border px-4 py-3 shadow-card', tones[item.variant]]"
        role="alert"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold">{{ item.title }}</p>
            <p v-if="item.description" class="mt-0.5 text-sm opacity-80">{{ item.description }}</p>
          </div>
          <button class="opacity-50 hover:opacity-100" :aria-label="t('common.dismiss')" @click="dismiss(item.id)">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
