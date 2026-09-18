<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useDashboardStore } from '../../store/dashboard.store'
import { useAuthStore } from '@/features/auth/store/auth.store'
import StatCard from '../components/StatCard.vue'
import { formatMoney } from '@/shared/utils/formatters'
import { BaseSkeleton, BaseCard } from '@/shared/ui'

const store = useDashboardStore()
const auth = useAuthStore()
const { t } = useI18n()
const { summary, loading, error } = storeToRefs(store)

const greetingName = computed(
  () => auth.profile?.name || auth.session?.user.email?.split('@')[0] || t('common.doctor'),
)

onMounted(() => store.fetchSummary())
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">
        {{ t('dashboard.greeting', { name: greetingName }) }}
      </h1>
      <p class="text-sm text-slate-500">{{ t('dashboard.subtitle') }}</p>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="n in 6" :key="n"><BaseSkeleton :rows="2" /></BaseCard>
    </div>

    <p v-else-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error.message }}
    </p>

    <div v-else-if="summary" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard :label="t('dashboard.totalPatients')" :value="summary.totalPatients" tone="primary" />
      <!-- Next to the total rather than off on its own: the interesting thing
           about it is the share of the whole it represents. -->
      <StatCard
        :label="t('dashboard.newPatientsThisMonth')"
        :value="summary.newPatientsThisMonth"
        tone="primary"
      />
      <StatCard :label="t('dashboard.appointmentsToday')" :value="summary.appointmentsToday" tone="accent" />
      <StatCard :label="t('dashboard.appointmentsUpcoming')" :value="summary.appointmentsUpcoming" tone="amber" />
      <!--
        Consultations and prescriptions are not built, and the summary no
        longer carries a zero for them: a field that is written rather than
        counted reads exactly like one that was.
      -->
      <StatCard
        :label="t('dashboard.revenueThisMonth')"
        :value="formatMoney(summary.revenueThisMonth)"
        tone="emerald"
      />
    </div>
  </div>
</template>
