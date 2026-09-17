<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../../store/notification.store'
import { routeFor, type AppNotification } from '../../domain/notification.models'
import { formatDateTime } from '@/shared/utils/datetime'
import { BaseButton, BaseCard, BaseEmptyState, BaseSpinner } from '@/shared/ui'

const store = useNotificationStore()
const router = useRouter()
const { t } = useI18n()
const { items, loading, unreadCount } = storeToRefs(store)

/** Reading one is opening it. Marking read by itself is a chore nobody wants. */
async function open(notification: AppNotification) {
  await store.markAsRead(notification.id)
  await router.push(routeFor(notification.kind))
}

onMounted(() => store.fetch())
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">{{ t('notifications.title') }}</h1>
        <p class="text-sm text-slate-500">{{ t('notifications.unread', { count: unreadCount }) }}</p>
      </div>
      <BaseButton variant="outline" :disabled="unreadCount === 0" @click="store.markAllAsRead()">
        {{ t('notifications.markAllRead') }}
      </BaseButton>
    </div>

    <div v-if="loading" class="py-16 text-center">
      <BaseSpinner size="lg" :label="t('common.loading')" />
    </div>

    <BaseCard v-else :padded="false">
      <BaseEmptyState
        v-if="items.length === 0"
        :title="t('notifications.emptyTitle')"
        :description="t('notifications.emptyBody')"
      />
      <ul v-else class="divide-y divide-surface-border">
        <li v-for="n in items" :key="n.id">
          <button
            type="button"
            class="flex w-full items-start gap-3 px-5 py-4 text-start transition-colors hover:bg-surface-muted"
            :class="n.isRead ? '' : 'bg-primary-50/40'"
            @click="open(n)"
          >
            <span
              class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              :class="n.isRead ? 'bg-transparent' : 'bg-primary-500'"
            />
            <span class="min-w-0">
              <span class="block text-sm font-medium text-slate-800">{{ n.title }}</span>
              <span class="mt-0.5 block text-sm text-slate-500">{{ n.body }}</span>
              <span class="mt-1 block text-xs text-slate-400">{{ formatDateTime(n.sentAt) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </BaseCard>
  </div>
</template>
