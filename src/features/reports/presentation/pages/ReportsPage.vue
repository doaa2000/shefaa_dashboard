<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { useReportStore } from '../../store/report.store'
import { BaseCard, BaseSelect, BaseSkeleton } from '@/shared/ui'
import { formatDate } from '@/shared/utils/datetime'
import { isRtl } from '@/shared/utils/formatters'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const store = useReportStore()
const { trend, loading } = storeToRefs(store)
const { t } = useI18n()
const rangeDays = ref<number>(30)

const rangeOptions = computed(() => [
  { label: t('reports.last7'), value: 7 },
  { label: t('reports.last30'), value: 30 },
  { label: t('reports.last90'), value: 90 },
])

onMounted(() => store.fetchTrend(rangeDays.value))
watch(rangeDays, (d) => store.fetchTrend(d))

const chartData = computed<ChartData<'line'>>(() => ({
  labels: (trend.value?.points ?? []).map((p) => formatDate(p.day)),
  datasets: [
    {
      label: t('reports.appointments'),
      data: (trend.value?.points ?? []).map((p) => p.total),
      // The two survivors of the old palette. Chart.js takes colours rather
      // than class names, so these are the brand written out by hand:
      // primary-600 for the line, primary-400 faded for what is under it.
      borderColor: '#2978a0',
      backgroundColor: 'rgba(103, 178, 216, 0.16)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
  ],
}))

// Reversed in Arabic so time runs the way the page is read: oldest on the
// right, newest on the left. A left-to-right timeline inside a right-to-left
// page reads as though the trend is going backwards.
const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { rtl: isRtl() } },
  scales: {
    x: { reverse: isRtl() },
    y: { beginAtZero: true, ticks: { precision: 0 }, position: isRtl() ? 'right' : 'left' },
  },
}))
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">{{ t('reports.title') }}</h1>
        <p class="text-sm text-slate-500">{{ t('reports.subtitle') }}</p>
      </div>
      <div class="w-44">
        <BaseSelect v-model="rangeDays" :options="rangeOptions" :placeholder="undefined" />
      </div>
    </div>

    <BaseCard :title="t('reports.chartTitle', { count: trend?.totalInPeriod ?? 0 })">
      <div class="h-80">
        <BaseSkeleton v-if="loading" :rows="6" height="h-6" />
        <Line v-else :data="chartData" :options="chartOptions" />
      </div>
    </BaseCard>
  </div>
</template>
