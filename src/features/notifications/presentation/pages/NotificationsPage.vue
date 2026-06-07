<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../store/notification.store'
import { formatDateTime } from '@/shared/utils/datetime'
import { BaseButton, BaseCard, BaseBadge, BaseEmptyState, BaseSpinner } from '@/shared/ui'

const store = useNotificationStore()
const { items, loading, unreadCount } = storeToRefs(store)

onMounted(() => store.fetch())
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Notifications</h1>
        <p class="text-sm text-slate-500">{{ unreadCount }} unread</p>
      </div>
      <BaseButton variant="outline" :disabled="unreadCount === 0" @click="store.markAllAsRead()">
        Mark all as read
      </BaseButton>
    </div>

    <div v-if="loading" class="py-16 text-center"><BaseSpinner size="lg" label="Loading…" /></div>

    <BaseCard v-else :padded="false">
      <BaseEmptyState v-if="items.length === 0" title="No notifications" description="You're all caught up." />
      <ul v-else class="divide-y divide-surface-border">
        <li
          v-for="n in items"
          :key="n.id"
          class="flex items-start justify-between gap-4 px-5 py-4"
          :class="!n.isRead ? 'bg-primary-50/40' : ''"
        >
          <div class="flex items-start gap-3">
            <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="n.isRead ? 'bg-transparent' : 'bg-primary-500'" />
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-slate-800">{{ n.title }}</p>
                <BaseBadge tone="neutral">{{ n.type }}</BaseBadge>
              </div>
              <p v-if="n.body" class="mt-0.5 text-sm text-slate-500">{{ n.body }}</p>
              <p class="mt-1 text-xs text-slate-400">{{ formatDateTime(n.createdAt) }}</p>
            </div>
          </div>
          <div class="flex shrink-0 gap-2">
            <BaseButton v-if="!n.isRead" size="sm" variant="ghost" @click="store.markAsRead(n.id)">Read</BaseButton>
            <BaseButton size="sm" variant="ghost" @click="store.remove(n.id)">Delete</BaseButton>
          </div>
        </li>
      </ul>
    </BaseCard>
  </div>
</template>
