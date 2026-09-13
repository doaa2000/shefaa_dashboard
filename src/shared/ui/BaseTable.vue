<script setup lang="ts" generic="T extends { id: string | number }">
import { useI18n } from 'vue-i18n'
import BaseSkeleton from './BaseSkeleton.vue'
import BaseEmptyState from './BaseEmptyState.vue'

export interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: string
}

defineProps<{
  columns: Column[]
  rows: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  rowClickable?: boolean
}>()

const emit = defineEmits<{ rowClick: [row: T] }>()

const { t } = useI18n()
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-surface-border bg-white">
    <table class="min-w-full divide-y divide-surface-border text-sm">
      <thead class="bg-surface-muted">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="col.width ? { width: col.width } : undefined"
            :class="[
              'px-4 py-3 font-medium text-slate-500',
              col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start',
            ]"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-border">
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-4 py-6">
            <BaseSkeleton :rows="4" />
          </td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length">
            <BaseEmptyState :title="emptyTitle ?? t('common.nothingHere')" :description="emptyDescription" />
          </td>
        </tr>
        <tr
          v-for="row in rows"
          v-else
          :key="row.id"
          :class="rowClickable ? 'cursor-pointer hover:bg-surface-muted' : ''"
          @click="rowClickable && emit('rowClick', row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-4 py-3 text-slate-700',
              col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start',
            ]"
          >
            <slot :name="`cell:${col.key}`" :row="row" :value="(row as Record<string, unknown>)[col.key]">
              {{ (row as Record<string, unknown>)[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
