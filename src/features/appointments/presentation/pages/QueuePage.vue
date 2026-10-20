<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/shared/composables/useToast'
import { useQueue, isoDay } from '../../application/useQueue'
import { timeLabel } from '@/features/schedule/domain/schedule.models'
import { formatTime } from '@/shared/utils/datetime'
import { statusLabel } from '../../domain/appointment.labels'
import { BaseButton } from '@/shared/ui'
import type { QueueEntry } from '../../domain/appointment.models'

const { t } = useI18n()
const toast = useToast()
const q = useQueue()

// Re-read on a timer as well as on every tap. Two people may have the page
// open, and a screen that only changes when you touch it shows one of them a
// patient the other finished ten minutes ago.
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  q.load()
  timer = setInterval(() => {
    if (q.isToday.value) q.load()
  }, 60_000)
})
onUnmounted(() => clearInterval(timer))

/**
 * Three lists, in the order the desk needs them: who is here (after whoever's
 * turn it is, in the order they will go in), who is still to come, and who is
 * finished. Finished is folded
 * away; it is only opened to put a mistake right.
 */
const waitingHere = computed(() => q.queue.value.inLine.slice(1))
const notHereYet = computed(() => q.queue.value.remaining.filter((e) => !e.isPresent))
const finished = computed(() =>
  q.queue.value.windows.flatMap((w) => w.entries).filter((e) => e.isDone),
)
const showFinished = ref(false)

const name = (e: QueueEntry) => q.nameOf(e) || t('queue.unnamed')

/** A time of day only when the booking has one of its own. For a session
 *  taken whole, everyone shares the same window and the time says nothing. */
const timeOf = (e: QueueEntry) => (e.wholeSession ? '' : timeLabel(e.startTime.slice(0, 5)))

/**
 * Every tap reports itself with its undo on the toast, so a tap on the wrong
 * row is put right where the eye already is.
 *
 * Each undo puts back exactly what the tap changed: the status it had, the
 * time they first arrived (so they keep their place in a queue run by
 * arrival), and the turn, if the tap took it from them.
 */
async function act(
  done: Promise<boolean>,
  message: string,
  undo: () => Promise<boolean>,
): Promise<void> {
  if (await done) toast.withUndo(message, t('queue.undo'), () => void undone(undo()))
  else failed()
}

async function undone(done: Promise<boolean>): Promise<void> {
  if (!(await done)) failed()
}

function failed(): void {
  if (q.error.value) toast.error(t('queue.failed'), q.error.value.message)
}

const isCurrent = (e: QueueEntry) => q.queue.value.current?.id === e.id

/** An undo that hands the turn back to whoever the tap took it from. */
async function regain(done: Promise<boolean>, e: QueueEntry, hadTurn: boolean): Promise<boolean> {
  const ok = await done
  if (ok && hadTurn) q.pin(e.id)
  return ok
}

const arrived = (e: QueueEntry) =>
  act(q.markArrived(e.id), t('queue.markedArrived', { name: name(e) }), () =>
    q.markNotArrived(e.id),
  )
function notArrived(e: QueueEntry): Promise<void> {
  const { arrivedAt } = e
  const hadTurn = isCurrent(e)
  return act(q.markNotArrived(e.id), t('queue.unmarkedArrived', { name: name(e) }), () =>
    regain(q.markArrived(e.id, arrivedAt ?? undefined), e, hadTurn),
  )
}
function seen(e: QueueEntry): Promise<void> {
  const { status } = e
  const hadTurn = isCurrent(e)
  return act(q.markSeen(e.id), t('queue.markedSeen', { name: name(e) }), () =>
    regain(q.restoreStatus(e.id, status), e, hadTurn),
  )
}
function absent(e: QueueEntry): Promise<void> {
  const { status } = e
  return act(q.markAbsent(e.id), t('queue.markedAbsent', { name: name(e) }), () =>
    q.restoreStatus(e.id, status),
  )
}
function reopen(e: QueueEntry): Promise<void> {
  const { status } = e
  return act(q.markWaiting(e.id), t('queue.returned', { name: name(e) }), () =>
    q.restoreStatus(e.id, status),
  )
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-5">
    <!-- Title, today's tally in one line, and the date tucked to the side:
         the desk works today, and another day is for settling arguments. -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">{{ t('queue.title') }}</h1>
        <p class="mt-1 text-sm text-slate-500">
          {{
            t('queue.tally', {
              here: q.queue.value.present,
              toCome: q.queue.value.notArrived,
              seen: q.queue.value.seen,
            })
          }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton v-if="!q.isToday.value" variant="ghost" size="sm" @click="q.setDate(isoDay())">
          {{ t('queue.backToToday') }}
        </BaseButton>
        <input
          type="date"
          :aria-label="t('queue.date')"
          class="h-9 rounded-lg border border-surface-border bg-white px-2 text-sm text-slate-700"
          :value="q.date.value"
          @change="q.setDate(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Whose turn it is. The one thing the page is for, and the one button
         pressed most. -->
    <section
      v-if="q.queue.value.current"
      class="rounded-2xl border-2 border-primary-200 bg-primary-50 p-5 text-center"
    >
      <p class="text-sm font-medium text-primary-900">{{ t('queue.nowWith') }}</p>
      <p class="mt-1 text-3xl font-bold text-slate-900">
        <span class="text-lg font-medium text-slate-400">#{{ q.queue.value.current.position }}</span>
        {{ name(q.queue.value.current) }}
      </p>
      <BaseButton
        class="mt-4 w-full sm:w-auto sm:min-w-[14rem]"
        size="lg"
        @click="seen(q.queue.value.current)"
      >
        ✓ {{ t('queue.markSeen') }}
      </BaseButton>
      <p v-if="q.queue.value.next" class="mt-3 text-sm text-slate-600">
        {{ t('queue.upNext') }}:
        <span class="font-medium text-slate-800">{{ name(q.queue.value.next) }}</span>
      </p>
      <!-- The turn stays here until one of these. Marked here by mistake, or
           gone out again, is the quiet one. -->
      <BaseButton
        variant="ghost"
        size="sm"
        class="mt-2"
        @click="notArrived(q.queue.value.current)"
      >
        {{ t('queue.markNotArrived') }}
      </BaseButton>
    </section>

    <section
      v-else-if="!q.loading.value"
      class="rounded-2xl border border-surface-border bg-white p-6 text-center"
    >
      <p class="font-medium text-slate-800">
        {{
          notHereYet.length
            ? t('queue.nobodyHere')
            : finished.length
              ? t('queue.allDone')
              : t('queue.nobodyBooked')
        }}
      </p>
      <p class="mt-1 text-sm text-slate-500">
        {{
          notHereYet.length
            ? t('queue.nobodyHereBody')
            : finished.length
              ? t('queue.allDoneBody')
              : t('queue.nobodyBookedBody')
        }}
      </p>
    </section>

    <!-- Here, waiting after whoever's turn it is. -->
    <section v-if="waitingHere.length">
      <h2 class="mb-2 text-sm font-semibold text-slate-600">
        {{ t('queue.present') }} ({{ waitingHere.length }})
      </h2>
      <ul
        class="divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border bg-white"
      >
        <li v-for="e in waitingHere" :key="e.id" class="px-4 py-3">
          <div class="flex items-center gap-3">
            <span class="w-7 text-sm text-slate-400">#{{ e.position }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-slate-800">{{ name(e) }}</p>
              <p class="text-xs text-slate-500">
                {{ t('queue.arrivedAt', { time: formatTime(e.arrivedAt) }) }}
              </p>
            </div>
            <BaseButton variant="outline" size="sm" @click="seen(e)">
              {{ t('queue.markSeen') }}
            </BaseButton>
            <BaseButton variant="ghost" size="sm" @click="notArrived(e)">
              {{ t('queue.markNotArrived') }}
            </BaseButton>
          </div>
        </li>
      </ul>
    </section>

    <!-- Booked, not here yet: one tap when they walk in. -->
    <section v-if="notHereYet.length">
      <h2 class="mb-2 text-sm font-semibold text-slate-600">
        {{ t('queue.notArrived') }} ({{ notHereYet.length }})
      </h2>
      <ul
        class="divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border bg-white"
      >
        <li v-for="e in notHereYet" :key="e.id" class="px-4 py-3">
          <div class="flex items-center gap-3">
            <span class="w-7 text-sm text-slate-400">#{{ e.position }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-slate-800">{{ name(e) }}</p>
              <p v-if="timeOf(e) || e.walkInPhone" class="text-xs text-slate-500">
                {{ timeOf(e) }}
                <span v-if="e.walkInPhone" dir="ltr">{{ e.walkInPhone }}</span>
              </p>
            </div>
            <BaseButton size="sm" @click="arrived(e)">{{ t('queue.markArrived') }}</BaseButton>
            <!-- In sight, not behind a menu: marking somebody who never came
                 is part of closing every day, and a menu nobody opens is a
                 button the desk does not have. -->
            <BaseButton variant="ghost" size="sm" @click="absent(e)">
              {{ t('queue.markAbsent') }}
            </BaseButton>
          </div>
        </li>
      </ul>
    </section>

    <!-- Finished, folded away: opened only to put a mistake right. -->
    <section v-if="finished.length">
      <button
        class="flex w-full items-center justify-between rounded-xl px-1 py-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
        @click="showFinished = !showFinished"
      >
        <span>{{ t('queue.finished') }} ({{ finished.length }})</span>
        <span>{{ showFinished ? '▴' : '▾' }}</span>
      </button>
      <ul
        v-if="showFinished"
        class="mt-2 divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border bg-white"
      >
        <li v-for="e in finished" :key="e.id" class="flex items-center gap-3 px-4 py-2.5">
          <span class="w-7 text-sm text-slate-300">#{{ e.position }}</span>
          <p class="min-w-0 flex-1 truncate text-slate-500">{{ name(e) }}</p>
          <span class="text-xs text-slate-400">{{ statusLabel(e.status) }}</span>
          <BaseButton variant="ghost" size="sm" @click="reopen(e)">
            {{ t('queue.undo') }}
          </BaseButton>
        </li>
      </ul>
    </section>
  </div>
</template>
