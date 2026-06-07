<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const store = useReportStore()
const { trend, loading } = storeToRefs(store)
const rangeDays = ref<number>(30)

const rangeOptions = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
]

onMounted(() => store.fetchTrend(rangeDays.value))
watch(rangeDays, (d) => store.fetchTrend(d))

const chartData = computed<ChartData<'line'>>(() => ({
  labels: (trend.value?.points ?? []).map((p) => formatDate(p.day)),
  datasets: [
    {
      label: 'Appointments',
      data: (trend.value?.points ?? []).map((p) => p.total),
      borderColor: '#1f796f',
      backgroundColor: 'rgba(42, 150, 136, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
    },
  ],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Reports</h1>
        <p class="text-sm text-slate-500">Appointment activity over time</p>
      </div>
      <div class="w-44">
        <BaseSelect v-model="rangeDays" :options="rangeOptions" :placeholder="undefined" />
      </div>
    </div>

    <BaseCard :title="`Appointments (${trend?.totalInPeriod ?? 0} in period)`">
      <div class="h-80">
        <BaseSkeleton v-if="loading" :rows="6" height="h-6" />
        <Line v-else :data="chartData" :options="chartOptions" />
      </div>
    </BaseCard>
  </div>
</template>
