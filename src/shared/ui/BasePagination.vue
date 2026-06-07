<script setup lang="ts">
import { pluralize } from '@/shared/utils/formatters'

defineProps<{ page: number; totalPages: number; total: number; hasPrev: boolean; hasNext: boolean }>()
const emit = defineEmits<{ prev: []; next: [] }>()
</script>

<template>
  <div class="flex items-center justify-between gap-4 px-1 py-2 text-sm">
    <span class="text-slate-500">{{ pluralize(total, 'result') }}</span>
    <div class="flex items-center gap-2">
      <button
        class="rounded-lg border border-surface-border px-3 py-1.5 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
        :disabled="!hasPrev"
        @click="emit('prev')"
      >
        Previous
      </button>
      <span class="text-slate-500">Page {{ page }} / {{ totalPages }}</span>
      <button
        class="rounded-lg border border-surface-border px-3 py-1.5 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
        :disabled="!hasNext"
        @click="emit('next')"
      >
        Next
      </button>
    </div>
  </div>
</template>
