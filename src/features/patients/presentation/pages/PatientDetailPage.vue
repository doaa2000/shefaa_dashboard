<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '../../store/patient.store'
import { useToast } from '@/shared/composables/useToast'
import { calculateAge, formatDate } from '@/shared/utils/datetime'
import PatientFormModal from '../components/PatientFormModal.vue'
import type { PatientFormValues } from '../../domain/patient.schema'
import {
  BaseAvatar,
  BaseBadge,
  BaseButton,
  BaseCard,
  BaseSpinner,
} from '@/shared/ui'

const route = useRoute()
const router = useRouter()
const store = usePatientStore()
const toast = useToast()
const { current, loading, saving } = storeToRefs(store)
const editing = ref(false)

const patientId = route.params.id as string

onMounted(() => store.fetchOne(patientId))

async function onSubmit(values: PatientFormValues) {
  const updated = await store.update(patientId, { ...values, allergies: values.allergies ?? [] })
  if (updated) {
    toast.success('Patient updated')
    editing.value = false
  } else if (store.error) {
    toast.error('Update failed', store.error.message)
  }
}

async function onDelete() {
  if (!confirm('Delete this patient? This cannot be undone.')) return
  const ok = await store.remove(patientId)
  if (ok) {
    toast.success('Patient deleted')
    await router.replace({ name: 'patients' })
  }
}
</script>

<template>
  <div class="space-y-5">
    <RouterLink to="/patients" class="text-sm text-primary-600 hover:underline">← Back to patients</RouterLink>

    <div v-if="loading" class="py-16 text-center"><BaseSpinner size="lg" label="Loading…" /></div>

    <template v-else-if="current">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <BaseAvatar :name="current.fullName" size="lg" />
          <div>
            <h1 class="text-xl font-semibold text-slate-900">{{ current.fullName }}</h1>
            <p class="text-sm text-slate-500">
              {{ current.gender }} · {{ calculateAge(current.dateOfBirth) ?? '—' }} yrs
            </p>
          </div>
          <BaseBadge :tone="current.isActive ? 'success' : 'neutral'">
            {{ current.isActive ? 'Active' : 'Inactive' }}
          </BaseBadge>
        </div>
        <div class="flex gap-2">
          <BaseButton variant="outline" @click="editing = true">Edit</BaseButton>
          <BaseButton variant="danger" @click="onDelete">Delete</BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BaseCard title="Contact information">
          <dl class="grid grid-cols-2 gap-y-3 text-sm">
            <dt class="text-slate-500">Email</dt>
            <dd class="text-slate-800">{{ current.email || '—' }}</dd>
            <dt class="text-slate-500">Phone</dt>
            <dd class="text-slate-800">{{ current.phone || '—' }}</dd>
            <dt class="text-slate-500">Date of birth</dt>
            <dd class="text-slate-800">{{ formatDate(current.dateOfBirth) }}</dd>
            <dt class="text-slate-500">Blood type</dt>
            <dd class="text-slate-800">{{ current.bloodType || '—' }}</dd>
            <dt class="text-slate-500">Address</dt>
            <dd class="text-slate-800">{{ current.address || '—' }}</dd>
          </dl>
        </BaseCard>

        <BaseCard title="Medical summary">
          <div class="space-y-3 text-sm">
            <div>
              <p class="text-slate-500">Allergies</p>
              <div v-if="current.allergies.length" class="mt-1 flex flex-wrap gap-1.5">
                <BaseBadge v-for="a in current.allergies" :key="a" tone="warning">{{ a }}</BaseBadge>
              </div>
              <p v-else class="text-slate-400">None recorded</p>
            </div>
            <div>
              <p class="text-slate-500">Medical history</p>
              <p class="mt-1 whitespace-pre-line text-slate-800">{{ current.medicalHistory || '—' }}</p>
            </div>
          </div>
        </BaseCard>
      </div>

      <PatientFormModal v-model="editing" :patient="current" :saving="saving" @submit="onSubmit" />
    </template>
  </div>
</template>
