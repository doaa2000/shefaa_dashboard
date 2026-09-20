<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useScheduleStore } from '../../store/schedule.store'
import {
  WHOLE_DAY,
  closureScopeOptions,
  toClosureSession,
  type ScheduleClosure,
} from '../../domain/schedule.models'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { labelFor } from '@/shared/utils/formatters'
import {
  BaseBadge,
  BaseButton,
  BaseCard,
  BaseEmptyState,
  BaseInput,
  BaseSelect,
  FormField,
} from '@/shared/ui'

const store = useScheduleStore()
const toast = useToast()
const { t } = useI18n()
const { closures, saving } = storeToRefs(store)

/** Today, in the clinic's own day. toISOString hands back UTC, which after
 *  10pm in Cairo is already tomorrow. */
function today(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

const date = ref(today())
const scope = ref<string>(WHOLE_DAY)
const reason = ref('')

/** How many people are already booked into what is about to be closed. Looked
 *  up as the date changes, because it is the one thing that should stop a
 *  doctor mid-click -- and nothing tells those patients but the doctor. */
const booked = ref<number | null>(null)

const scopes = computed(() => closureScopeOptions())

async function refreshBooked() {
  booked.value = null
  if (!date.value) return
  booked.value = await store.bookingsOn(date.value, toClosureSession(scope.value))
}

onMounted(async () => {
  await store.fetchClosures()
  await refreshBooked()
})
watch([date, scope], refreshBooked)

async function add() {
  const added = await store.addClosure({
    date: date.value,
    session: toClosureSession(scope.value),
    reason: reason.value.trim() || null,
  })

  if (added) {
    toast.success(t('settings.closureAdded'))
    reason.value = ''
    await refreshBooked()
    return
  }

  // The unique index is the likely cause, and "duplicate key value
  // violates..." tells a doctor nothing.
  const duplicate = store.error?.message?.includes('duplicate key')
  toast.error(
    t(duplicate ? 'settings.closureDuplicate' : 'settings.closureAddFailed'),
    duplicate ? undefined : store.error?.message,
  )
}

async function reopen(closure: ScheduleClosure) {
  if (await store.removeClosure(closure.id)) {
    toast.success(t('settings.closureRemoved'))
    await refreshBooked()
  }
}

const scopeLabel = (closure: ScheduleClosure) =>
  closure.session ? labelFor('session', closure.session) : t('settings.wholeDay')
</script>

<template>
  <BaseCard :title="t('settings.closures')" :subtitle="t('settings.closuresSubtitle')">
    <form class="grid grid-cols-1 gap-3 sm:grid-cols-4" @submit.prevent="add">
      <FormField :label="t('settings.closureDate')">
        <!-- No past dates: closing a day that has gone changes nothing and
             leaves a row that looks like it did something. -->
        <BaseInput v-model="date" type="date" :min="today()" />
      </FormField>
      <FormField :label="t('settings.closureScope')">
        <BaseSelect v-model="scope" :options="scopes" :placeholder="undefined" />
      </FormField>
      <FormField
        class="sm:col-span-2"
        :label="t('settings.closureReason')"
        :hint="t('settings.closureReasonHint')"
      >
        <BaseInput v-model="reason" />
      </FormField>
      <div class="sm:col-span-4">
        <BaseButton type="submit" :loading="saving">{{ t('settings.closureAdd') }}</BaseButton>
      </div>
    </form>

    <!-- The whole point of asking first. Closing a day does not reach the
         people booked into it; the doctor has to. -->
    <p
      v-if="booked !== null"
      class="mt-3 text-sm"
      :class="booked > 0 ? 'text-amber-700' : 'text-slate-500'"
    >
      {{ booked > 0 ? t('settings.closureBooked', { count: booked }) : t('settings.closureBookedNone') }}
    </p>

    <div class="mt-5">
      <BaseEmptyState
        v-if="closures.length === 0"
        :title="t('settings.closureNone')"
        :description="t('settings.closureNoneBody')"
      />

      <ul v-else class="divide-y divide-surface-border">
        <li
          v-for="closure in closures"
          :key="closure.id"
          class="flex flex-wrap items-center justify-between gap-3 py-3"
        >
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-medium text-slate-800">{{ formatDate(closure.date) }}</span>
            <BaseBadge tone="neutral">{{ scopeLabel(closure) }}</BaseBadge>
            <span v-if="closure.reason" class="text-sm text-slate-500">{{ closure.reason }}</span>
          </div>
          <BaseButton size="sm" variant="ghost" @click="reopen(closure)">
            {{ t('settings.closureReopen') }}
          </BaseButton>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
