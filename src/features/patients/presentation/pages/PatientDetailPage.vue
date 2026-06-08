<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../../store/patient.store'
import { calculateAge, formatDate } from '@/shared/utils/datetime'
import { titleCase } from '@/shared/utils/formatters'
import { BaseAvatar, BaseCard, BaseSpinner } from '@/shared/ui'

const route = useRoute()
const store = usePatientStore()
const { current, loading } = storeToRefs(store)

const patientId = route.params.id as string
onMounted(() => store.fetchOne(patientId))
</script>

<template>
  <div class="space-y-5">
    <RouterLink to="/patients" class="text-sm text-primary-600 hover:underline">← Back to patients</RouterLink>

    <div v-if="loading" class="py-16 text-center"><BaseSpinner size="lg" label="Loading…" /></div>

    <template v-else-if="current">
      <div class="flex items-center gap-4">
        <BaseAvatar :name="current.name" size="lg" />
        <div>
          <h1 class="text-xl font-semibold text-slate-900">{{ current.name }}</h1>
          <p class="text-sm text-slate-500">
            {{ current.gender ? titleCase(current.gender) : '—' }} ·
            {{ calculateAge(current.birthDate) ?? '—' }} yrs
          </p>
        </div>
      </div>

      <BaseCard title="Contact information">
        <dl class="grid grid-cols-2 gap-y-3 text-sm">
          <dt class="text-slate-500">Phone</dt>
          <dd class="text-slate-800">{{ current.phone || '—' }}</dd>
          <dt class="text-slate-500">Date of birth</dt>
          <dd class="text-slate-800">{{ formatDate(current.birthDate) }}</dd>
          <dt class="text-slate-500">Gender</dt>
          <dd class="text-slate-800">{{ current.gender ? titleCase(current.gender) : '—' }}</dd>
        </dl>
      </BaseCard>
    </template>
  </div>
</template>
