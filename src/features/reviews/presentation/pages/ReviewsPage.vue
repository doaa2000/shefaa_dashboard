<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useReviewStore } from '../../store/review.store'
import { useToast } from '@/shared/composables/useToast'
import { formatDate } from '@/shared/utils/datetime'
import { formatNumber } from '@/shared/utils/formatters'
import { BaseCard, BaseEmptyState, BaseSkeleton } from '@/shared/ui'

const store = useReviewStore()
const toast = useToast()
const { t } = useI18n()
const { items, loading, error, average, withNotes } = storeToRefs(store)

/** Most reviews are stars alone. A doctor who came to read what was said
 *  should not have to scroll past them to find it. */
const notesOnly = ref(false)
const shown = computed(() => (notesOnly.value ? items.value.filter((r) => r.comment) : items.value))

onMounted(() => store.fetchList())
watch(error, (e) => {
  if (e) toast.error(e.message ?? t('reviews.loadFailed'))
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">{{ t('reviews.title') }}</h1>
      <p class="text-sm text-slate-500">{{ t('reviews.subtitle') }}</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">{{ t('reviews.average') }}</p>
        <p class="mt-2 text-2xl font-semibold text-amber-500">
          {{ items.length ? formatNumber(Number(average.toFixed(1))) : '—' }}
          <span class="text-base text-slate-400">/ 5</span>
        </p>
        <p class="mt-1 text-xs text-slate-500">{{ t('reviews.count', { count: items.length }) }}</p>
      </div>
      <div class="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
        <p class="text-sm font-medium text-slate-500">{{ t('reviews.notes') }}</p>
        <p class="mt-2 text-2xl font-semibold text-slate-800">{{ formatNumber(withNotes) }}</p>
        <!-- Said here because it is the first thing a doctor will wonder. -->
        <p class="mt-1 text-xs text-slate-500">{{ t('reviews.privacy') }}</p>
      </div>
    </div>

    <BaseCard :padded="false">
      <template #header>
        <h3 class="text-sm font-semibold text-slate-800">{{ t('reviews.listTitle') }}</h3>
      </template>
      <template #actions>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="notesOnly" type="checkbox" class="rounded border-slate-300" />
          {{ t('reviews.notesOnly') }}
        </label>
      </template>

      <div v-if="loading" class="p-5"><BaseSkeleton :rows="4" /></div>
      <BaseEmptyState
        v-else-if="shown.length === 0"
        :title="notesOnly ? t('reviews.noNotes') : t('reviews.emptyTitle')"
        :description="notesOnly ? undefined : t('reviews.emptyBody')"
      />
      <ul v-else class="divide-y divide-surface-border">
        <li v-for="review in shown" :key="review.id" class="space-y-1.5 px-5 py-4">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="text-amber-500" :aria-label="t('reviews.stars', { count: review.stars })">
              <span v-for="i in 5" :key="i" :class="{ 'text-slate-300': i > review.stars }">
                ★
              </span>
            </span>
            <span class="font-medium text-slate-800">
              {{ review.patientName ?? t('reviews.patient') }}
            </span>
            <span class="text-xs text-slate-400">{{ formatDate(review.createdAt) }}</span>
          </div>
          <p v-if="review.comment" class="whitespace-pre-line text-sm text-slate-700">
            {{ review.comment }}
          </p>
        </li>
      </ul>
    </BaseCard>
  </div>
</template>
