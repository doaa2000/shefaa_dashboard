<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../../store/dashboard.store'
import { useAuthStore } from '@/features/auth/store/auth.store'
import StatCard from '../components/StatCard.vue'
import { BaseSkeleton, BaseCard } from '@/shared/ui'

const store = useDashboardStore()
const auth = useAuthStore()
const { summary, loading, error } = storeToRefs(store)

const greetingName = computed(
  () => auth.profile?.name || auth.session?.user.email?.split('@')[0] || 'Doctor',
)

onMounted(() => store.fetchSummary())
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">Welcome back, {{ greetingName }}</h1>
      <p class="text-sm text-slate-500">Here's an overview of your practice today.</p>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="n in 6" :key="n"><BaseSkeleton :rows="2" /></BaseCard>
    </div>

    <p v-else-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error.message }}
    </p>

    <div v-else-if="summary" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total patients" :value="summary.totalPatients" tone="primary" />
      <StatCard label="Appointments today" :value="summary.appointmentsToday" tone="accent" />
      <StatCard label="Upcoming appointments" :value="summary.appointmentsUpcoming" tone="amber" />
      <!--
        Consultations and prescriptions are not built. A tile reading "0" for
        something that cannot happen is not a measurement, it is a promise the
        doctor will wonder why nobody keeps. The fields stay in the summary so
        the tiles can come back the day the features do.
      -->
      <StatCard label="Revenue this month" :value="`EGP ${summary.revenueThisMonth.toLocaleString()}`" tone="emerald" />
    </div>
  </div>
</template>
