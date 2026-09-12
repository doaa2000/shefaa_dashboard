<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQueueStore } from '../../store/queue.store'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { statusLabel, statusTone } from '../../domain/appointment.labels'
import type { QueueEntry, SessionQueue } from '../../domain/appointment.models'
import { BaseBadge, BaseButton, BaseCard, BaseEmptyState, BaseSpinner } from '@/shared/ui'

const store = useQueueStore()
const toast = useToast()
const { date, sessions, loading, advancing, isEmpty, error } = storeToRefs(store)

const dateInput = ref(date.value)

onMounted(store.load)
watch(dateInput, (value) => {
  store.setDate(value)
  void store.load()
})

function sessionLabel(session: string): string {
  return session === 'morning' ? 'Morning' : 'Evening'
}

/** "Evening · 18:00 - 21:00", which is what the patient was told to arrive in. */
function windowLabel(queue: SessionQueue): string {
  const from = queue.startTime.slice(0, 5)
  const to = queue.endTime.slice(0, 5)
  if (!from && !to) return sessionLabel(queue.session)
  return `${sessionLabel(queue.session)} · ${from} - ${to}`
}

async function settle(entry: QueueEntry, status: 'completed' | 'no_show') {
  const ok = await store.settle(entry.id, status)
  if (ok) {
    toast.success(
      status === 'completed' ? 'Marked as seen' : 'Marked as no show',
      entry.patientName ?? `#${entry.position}`,
    )
  } else if (store.error) {
    toast.error('Could not update', store.error.message)
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Today's queue</h1>
        <p class="text-sm text-slate-500">
          Call patients in order — {{ formatDate(date) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model="dateInput"
          type="date"
          class="rounded-xl border border-surface-border px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none"
        />
        <BaseButton variant="outline" :loading="loading" @click="store.load()">Refresh</BaseButton>
      </div>
    </div>

    <div v-if="loading && !sessions.length" class="flex justify-center py-16">
      <BaseSpinner />
    </div>

    <BaseCard v-else-if="error" padded>
      <BaseEmptyState title="Nothing to show" :description="error.message" />
    </BaseCard>

    <BaseCard v-else-if="isEmpty" padded>
      <BaseEmptyState
        title="Nobody booked for this day"
        :description="`Patients who book for ${formatDate(date)} appear here, in the order they booked. Check the date if you are expecting someone.`"
      />
    </BaseCard>

    <BaseCard
      v-for="queue in sessions"
      v-else
      :key="`${queue.session}|${queue.startTime}`"
      padded
    >
      <template #header>
        <h3 class="text-sm font-semibold text-slate-800">{{ windowLabel(queue) }}</h3>
        <p class="mt-0.5 text-xs text-slate-500">
          {{ queue.done.length }} of {{ queue.entries.length }} seen
        </p>
      </template>

      <!-- Now serving -->
      <div
        v-if="queue.current"
        class="rounded-2xl border border-primary-200 bg-primary-50 p-5"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-primary-700">Now serving</p>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <span
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white"
            >
              {{ queue.current.position }}
            </span>
            <div>
              <p class="text-lg font-semibold text-slate-900">
                {{ queue.current.patientName ?? 'Unnamed patient' }}
              </p>
              <p class="text-sm text-slate-600">
                {{ queue.waiting.length }} still waiting
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="outline"
              :disabled="advancing !== null"
              @click="settle(queue.current, 'no_show')"
            >
              No show
            </BaseButton>
            <BaseButton
              size="lg"
              :loading="advancing === queue.current.id"
              @click="settle(queue.current, 'completed')"
            >
              Seen — next patient
            </BaseButton>
          </div>
        </div>
      </div>

      <div
        v-else
        class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"
      >
        Everyone booked into this time has been seen.
      </div>

      <!-- Waiting -->
      <div v-if="queue.waiting.length" class="mt-5">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Waiting</p>
        <ul class="divide-y divide-surface-border rounded-xl border border-surface-border">
          <li
            v-for="entry in queue.waiting"
            :key="entry.id"
            class="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600"
              >
                {{ entry.position }}
              </span>
              <span class="text-sm text-slate-700">
                {{ entry.patientName ?? 'Unnamed patient' }}
              </span>
            </div>
            <BaseBadge :tone="statusTone(entry.status)">{{ statusLabel(entry.status) }}</BaseBadge>
          </li>
        </ul>
      </div>

      <!-- Already dealt with -->
      <div v-if="queue.done.length" class="mt-5">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Done</p>
        <ul class="divide-y divide-surface-border rounded-xl border border-surface-border opacity-70">
          <li
            v-for="entry in queue.done"
            :key="entry.id"
            class="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-400"
              >
                {{ entry.position }}
              </span>
              <span class="text-sm text-slate-500 line-through">
                {{ entry.patientName ?? 'Unnamed patient' }}
              </span>
            </div>
            <BaseBadge :tone="statusTone(entry.status)">{{ statusLabel(entry.status) }}</BaseBadge>
          </li>
        </ul>
      </div>
    </BaseCard>
  </div>
</template>
