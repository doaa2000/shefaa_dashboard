<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/shared/composables/useToast'
import { useQueue, isoDay } from '../../application/useQueue'
import { timeLabel } from '@/features/schedule/domain/schedule.models'
import { labelFor } from '@/shared/utils/formatters'
import { formatTime } from '@/shared/utils/datetime'
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

async function arrived(entry: QueueEntry): Promise<void> {
  if (await q.markArrived(entry.id)) toast.success(t('queue.markedArrived', { name: q.nameOf(entry) }))
  else if (q.error.value) toast.error(t('queue.failed'), q.error.value.message)
}

async function notArrived(entry: QueueEntry): Promise<void> {
  if (await q.markNotArrived(entry.id)) toast.info(t('queue.unmarkedArrived', { name: q.nameOf(entry) }))
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

    <!-- The questions the desk is actually asked: how many are here, how many
         are still to come, how many are done. -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <BaseCard class="text-center">
        <p class="text-sm text-slate-500">{{ t('queue.present') }}</p>
        <p class="mt-1 text-3xl font-semibold text-primary-900">{{ q.queue.value.present }}</p>
      </BaseCard>
      <BaseCard class="text-center">
        <p class="text-sm text-slate-500">{{ t('queue.notArrived') }}</p>
        <p class="mt-1 text-3xl font-semibold text-amber-600">{{ q.queue.value.notArrived }}</p>
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

    <!-- The one card the room is about: whose turn it is, among those here. -->
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
        {{ t('queue.bookingNumber', { n: q.queue.value.current.position }) }} ·
        {{ windowLabel(q.queue.value.current.startTime, q.queue.value.current.endTime) }}
        <span v-if="q.queue.value.current.walkInPhone" dir="ltr" class="ms-2 text-slate-500">
          {{ q.queue.value.current.walkInPhone }}
        </span>
      </p>

      <!-- Under one tap, deliberately. The queue only tells the truth if the
           marking happens, and marking buried in a dropdown does not happen. -->
      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton @click="seen(q.queue.value.current)">{{ t('queue.markSeen') }}</BaseButton>
        <BaseButton variant="ghost" @click="notArrived(q.queue.value.current)">
          {{ t('queue.markNotArrived') }}
        </BaseButton>
      </div>

      <p v-if="q.queue.value.next" class="mt-4 border-t border-primary-200 pt-3 text-sm text-slate-600">
        {{ t('queue.upNext') }}:
        <span class="font-medium text-slate-800">
          {{ q.nameOf(q.queue.value.next) || t('queue.unnamed') }}
        </span>
        <span class="text-slate-500">
          — {{ t('queue.bookingNumber', { n: q.queue.value.next.position }) }}
        </span>
      </p>
    </div>

    <div
      v-else-if="!q.loading.value"
      class="rounded-2xl border border-surface-border bg-white p-6 text-center"
    >
      <template v-if="q.queue.value.notArrived > 0">
        <p class="font-medium text-slate-800">{{ t('queue.nobodyHere') }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ t('queue.nobodyHereBody') }}</p>
      </template>
      <template v-else>
        <p class="font-medium text-slate-800">
          {{ q.queue.value.windows.length ? t('queue.allDone') : t('queue.nobodyBooked') }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ q.queue.value.windows.length ? t('queue.allDoneBody') : t('queue.nobodyBookedBody') }}
        </p>
      </template>
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
          class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-surface-border px-4 py-3 last:border-b-0"
          :class="{ 'bg-slate-50': e.isDone }"
        >
          <span class="w-6 text-center text-sm font-medium text-slate-400">{{ e.position }}</span>
          <div class="min-w-[9rem] flex-1">
            <p class="truncate font-medium" :class="e.isDone ? 'text-slate-400' : 'text-slate-800'">
              {{ q.nameOf(e) || t('queue.unnamed') }}
            </p>
            <p class="text-xs text-slate-500">
              {{ e.origin === 'clinic' ? t('appointments.origin.clinic') : t('appointments.origin.app') }}
            </p>
          </div>
          <!-- Each row says where the person is and offers the one next tap
               that fits it. Every tap has its undo beside it: a tap on the
               wrong row is the commonest thing that will happen here, and the
               way back must not be a phone call to the administrator. -->
          <!-- Its own line on a phone, so the name is not cut short. -->
          <div class="flex items-center gap-2 max-sm:w-full max-sm:ps-9">
            <template v-if="e.isDone">
              <BaseBadge :tone="statusTone(e.status)">{{ statusLabel(e.status) }}</BaseBadge>
              <BaseButton variant="ghost" size="sm" @click="undo(e)">{{ t('queue.undo') }}</BaseButton>
            </template>
            <template v-else-if="e.isPresent">
              <BaseBadge tone="info">{{ t('queue.arrivedAt', { time: formatTime(e.arrivedAt) }) }}</BaseBadge>
              <BaseButton v-if="e.id !== q.queue.value.current?.id" size="sm" @click="seen(e)">
                {{ t('queue.markSeen') }}
              </BaseButton>
              <BaseButton variant="ghost" size="sm" @click="notArrived(e)">{{ t('queue.undo') }}</BaseButton>
            </template>
            <template v-else>
              <BaseBadge tone="warning">{{ t('queue.notArrivedBadge') }}</BaseBadge>
              <BaseButton size="sm" @click="arrived(e)">{{ t('queue.markArrived') }}</BaseButton>
              <BaseButton variant="ghost" size="sm" @click="absent(e)">{{ t('queue.markAbsent') }}</BaseButton>
            </template>
          </div>
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
