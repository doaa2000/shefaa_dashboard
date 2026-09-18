<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ page: number; totalPages: number; total: number; hasPrev: boolean; hasNext: boolean }>()
const emit = defineEmits<{ prev: []; next: [] }>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center justify-between gap-4 px-1 py-2 text-sm">
    <span class="text-slate-500">{{ t('common.results', { count: total }) }}</span>
    <div class="flex items-center gap-2">
      <button
        class="rounded-lg border border-surface-border px-3 py-1.5 text-slate-600 disabled:opacity-40 hover:bg-primary-50"
        :disabled="!hasPrev"
        @click="emit('prev')"
      >
        {{ t('common.previous') }}
      </button>
      <span class="text-slate-500">{{ t('common.page', { page, total: totalPages }) }}</span>
      <button
        class="rounded-lg border border-surface-border px-3 py-1.5 text-slate-600 disabled:opacity-40 hover:bg-primary-50"
        :disabled="!hasNext"
        @click="emit('next')"
      >
        {{ t('common.next') }}
      </button>
    </div>
  </div>
</template>
