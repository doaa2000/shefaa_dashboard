<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatMoney, labelFor } from '@/shared/utils/formatters'
import type { MethodTotals } from '../../domain/payment.models'

defineProps<{ rows: MethodTotals[] }>()

const { t } = useI18n()
const money = (n: number) => formatMoney(n)
</script>

<template>
  <!-- Cash is in the drawer and instapay is in the bank. They are counted apart
       because at the end of the day they are reconciled apart. -->
  <div v-if="rows.length" class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
    <p class="text-sm font-medium text-slate-500">{{ t('payments.byMethod') }}</p>
    <div class="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="row in rows"
        :key="row.method"
        class="rounded-xl border border-surface-border px-4 py-3"
      >
        <div class="flex items-center justify-between">
          <p class="font-medium text-slate-800">{{ labelFor('method', row.method) }}</p>
          <p class="text-xs text-slate-400">{{ row.count }}</p>
        </div>
        <p class="mt-1 text-sm text-emerald-600">
          {{ t('payments.collectedSuffix', { amount: money(row.collected) }) }}
        </p>
        <p v-if="row.outstanding > 0" class="text-sm text-amber-600">
          {{ t('payments.outstandingSuffix', { amount: money(row.outstanding) }) }}
        </p>
      </div>
    </div>
  </div>
</template>
