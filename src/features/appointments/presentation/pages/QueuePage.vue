<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/shared/composables/useToast'
import { useQueue, isoDay } from '../../application/useQueue'
import { timeLabel } from '@/features/schedule/domain/schedule.models'
import { labelFor } from '@/shared/utils/formatters'
import { statusLabel, statusTone } from '../../domain/appointment.labels'
import { BaseBadge, BaseButton, BaseCard, FormField } from '@/shared/ui'
import type { QueueEntry } from '../../domain/appointment.models'

const { t } = useI18n()
const toast = useToast()
const q = useQueue()

// Re-read on a timer as well as on every tap. Two people work this page --
// the doctor inside and whoever is at the desk -- and a screen that only
// changes when you touch it shows the desk a patient the doctor finished ten
// minutes ago.
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  q.load()
  timer = setInterval(() => {
    if (q.isToday.value) q.load()
  }, 60_000)
})
onUnmounted(() => clearInterval(timer))

async function seen(entry: QueueEntry): Promise<void> {
  if (await q.markSeen(entry.id)) toast.success(t('queue.markedSeen', { name: q.nameOf(entry) }))
  else if (q.error.value) toast.error(t('queue.failed'), q.error.value.message)
}

async function absent(entry: QueueEntry): Promise<void> {
  if (await q.markAbsent(entry.id)) toast.info(t('queue.markedAbsent', { name: q.nameOf(entry) }))
  else if (q.error.value) toast.error(t('queue.failed'), q.error.value.message)
}

async function undo(entry: QueueEntry): Promise<void> {
  if (await q.markWaiting(entry.id)) toast.info(t('queue.returned', { name: q.nameOf(entry) }))
  else if (q.error.value) toast.error(t('queue.failed'), q.error.value.message)
}

function windowLabel(startTime: string, endTime: string): string {
  return `${timeLabel(startTime.slice(0, 5))} – ${timeLabel(endTime.slice(0, 5))}`
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">{{ t('queue.title') }}</h1>
        <p class="text-sm text-slate-500">{{ t('queue.subtitle') }}</p>
      </div>
      <!-- A date, not only today. Yesterday is how the clinic settles an
           argument about who was seen. -->
      <div class="flex items-end gap-2">
        <FormField :label="t('queue.date')">
          <input
            type="date"
            class="h-10 rounded-xl border border-surface-border bg-white px-3 text-sm text-slate-800"
            :value="q.date.value"
            @change="q.setDate(($event.target as HTMLInputElement).value)"
          />
        </FormField>
        <BaseButton v-if="!q.isToday.value" variant="ghost" size="sm" @click="q.setDate(isoDay())">
          {{ t('queue.backToToday') }}
        </BaseButton>
      </div>
    </div>

    <!-- Three numbers, which is the question the desk is actually asked:
         "how many left?" -->
    <div class="grid grid-cols-3 gap-3">
      <BaseCard class="text-center">
        <p class="text-sm text-slate-500">{{ t('queue.waiting') }}</p>
        <p class="mt-1 text-3xl font-semibold text-primary-900">{{ q.queue.value.waiting }}</p>
      </BaseCard>
      <BaseCard class="text-center">
        <p class="text-sm text-slate-500">{{ t('queue.seen') }}</p>
        <p class="mt-1 text-3xl font-semibold text-emerald-600">{{ q.queue.value.seen }}</p>
      </BaseCard>
      <BaseCard class="text-center">
        <p class="text-sm text-slate-500">{{ t('queue.absent') }}</p>
        <p class="mt-1 text-3xl font-semibold text-slate-400">{{ q.queue.value.absent }}</p>
      </BaseCard>
    </div>

    <!-- The one card the room is about. -->
    <div
      v-if="q.queue.value.current"
      class="rounded-2xl border-2 border-primary-200 bg-primary-50 p-5"
    >
      <p class="text-sm font-medium text-primary-900">{{ t('queue.nowWith') }}</p>
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <p class="text-2xl font-semibold text-slate-900">
          {{ q.nameOf(q.queue.value.current) || t('queue.unnamed') }}
        </p>
        <BaseBadge :tone="q.queue.value.current.origin === 'clinic' ? 'neutral' : 'info'">
          {{
            q.queue.value.current.origin === 'clinic'
              ? t('appointments.origin.clinic')
              : t('appointments.origin.app')
          }}
        </BaseBadge>
      </div>
      <p class="mt-1 text-sm text-slate-600">
        {{ windowLabel(q.queue.value.current.startTime, q.queue.value.current.endTime) }}
        <span v-if="q.queue.value.current.walkInPhone" dir="ltr" class="ms-2 text-slate-500">
          {{ q.queue.value.current.walkInPhone }}
        </span>
      </p>

      <!-- Under one tap, deliberately. The queue only tells the truth if the
           marking happens, and marking buried in a dropdown does not happen. -->
      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton @click="seen(q.queue.value.current)">{{ t('queue.markSeen') }}</BaseButton>
        <BaseButton variant="outline" @click="absent(q.queue.value.current)">
          {{ t('queue.markAbsent') }}
        </BaseButton>
      </div>

      <p v-if="q.queue.value.next" class="mt-4 border-t border-primary-200 pt-3 text-sm text-slate-600">
        {{ t('queue.upNext') }}:
        <span class="font-medium text-slate-800">
          {{ q.nameOf(q.queue.value.next) || t('queue.unnamed') }}
        </span>
        <span class="text-slate-500">
          — {{ windowLabel(q.queue.value.next.startTime, q.queue.value.next.endTime) }}
        </span>
      </p>
    </div>

    <div
      v-else-if="!q.loading.value"
      class="rounded-2xl border border-surface-border bg-white p-6 text-center"
    >
      <p class="font-medium text-slate-800">
        {{ q.queue.value.windows.length ? t('queue.allDone') : t('queue.nobodyBooked') }}
      </p>
      <p class="mt-1 text-sm text-slate-500">
        {{ q.queue.value.windows.length ? t('queue.allDoneBody') : t('queue.nobodyBookedBody') }}
      </p>
    </div>

    <!-- The whole day under it, grouped the way the doctor published it. -->
    <div v-for="w in q.queue.value.windows" :key="w.session + w.startTime" class="space-y-2">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-semibold text-slate-700">
          {{ labelFor('session', w.session) }} · {{ windowLabel(w.startTime, w.endTime) }}
        </h2>
        <BaseBadge v-if="w.isFinished" tone="success">{{ t('queue.windowFinished') }}</BaseBadge>
        <BaseBadge v-else-if="w.hasStarted" tone="warning">{{ t('queue.windowRunning') }}</BaseBadge>
      </div>

      <div class="overflow-hidden rounded-xl border border-surface-border bg-white">
        <div
          v-for="e in w.entries"
          :key="e.id"
          class="flex items-center gap-3 border-b border-surface-border px-4 py-3 last:border-b-0"
          :class="{ 'bg-slate-50': e.isDone }"
        >
          <span class="w-6 text-center text-sm font-medium text-slate-400">{{ e.position }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium" :class="e.isDone ? 'text-slate-400' : 'text-slate-800'">
              {{ q.nameOf(e) || t('queue.unnamed') }}
            </p>
            <p class="text-xs text-slate-500">
              {{ e.origin === 'clinic' ? t('appointments.origin.clinic') : t('appointments.origin.app') }}
            </p>
          </div>
          <BaseBadge :tone="statusTone(e.status)">{{ statusLabel(e.status) }}</BaseBadge>
          <!-- Reversible. A tap on the wrong row is the commonest thing that
               will happen on this page, and the only way back must not be a
               phone call to the administrator. -->
          <BaseButton v-if="e.isDone" variant="ghost" size="sm" @click="undo(e)">
            {{ t('queue.undo') }}
          </BaseButton>
          <BaseButton v-else-if="e.id !== q.queue.value.current?.id" variant="ghost" size="sm" @click="seen(e)">
            {{ t('queue.markSeen') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Said once, at the bottom, where it does not shout: the page is only as
         true as the marking, and whoever works it should know that. -->
    <p v-if="q.queue.value.windows.length" class="text-xs text-slate-400">
      {{ t('queue.inferredNote') }}
    </p>
  </div>
</template>
