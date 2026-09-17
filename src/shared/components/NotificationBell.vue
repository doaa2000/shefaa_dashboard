<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'
import { useNotificationStore } from '@/features/notifications/store/notification.store'
import { routeFor, type AppNotification } from '@/features/notifications/domain/notification.models'
import { formatDateTime } from '@/shared/utils/datetime'

const router = useRouter()
const store = useNotificationStore()
const { t } = useI18n()
const { items, unreadCount } = storeToRefs(store)

const open = ref(false)
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (open.value = false))

// The list is fetched and kept current by the layout, which outlives this
// dropdown and is also what the notifications page reads. Fetching here as
// well would mean two requests for one answer.

async function go(notification: AppNotification) {
  open.value = false
  await store.markAsRead(notification.id)
  await router.push(routeFor(notification.kind))
}

function goToAll() {
  open.value = false
  void router.push('/notifications')
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      class="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-surface-muted"
      :aria-label="t('notifications.title')"
      @click="open = !open"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1"
        />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ltr:-right-0.5 rtl:-left-0.5"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- `end-0` rather than `right-0`: in Arabic the bell sits at the other
         side of the bar, and a panel pinned right would open off the screen. -->
    <div
      v-if="open"
      class="absolute end-0 mt-2 w-80 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-elevated"
    >
      <header class="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <p class="text-sm font-semibold text-slate-800">{{ t('notifications.title') }}</p>
        <button
          v-if="unreadCount > 0"
          class="text-xs font-medium text-primary-600 hover:underline"
          @click="store.markAllAsRead()"
        >
          {{ t('notifications.markAllRead') }}
        </button>
      </header>

      <ul class="max-h-80 divide-y divide-surface-border overflow-y-auto">
        <li v-if="items.length === 0" class="px-4 py-6 text-center text-sm text-slate-400">
          {{ t('notifications.emptyTitle') }}
        </li>
        <li v-for="n in items.slice(0, 6)" :key="n.id">
          <button
            type="button"
            class="w-full px-4 py-3 text-start hover:bg-surface-muted"
            :class="n.isRead ? '' : 'bg-primary-50/40'"
            @click="go(n)"
          >
            <span class="block text-sm font-medium text-slate-800">{{ n.title }}</span>
            <span class="block text-xs text-slate-500">{{ n.body }}</span>
            <span class="mt-0.5 block text-[11px] text-slate-400">{{ formatDateTime(n.sentAt) }}</span>
          </button>
        </li>
      </ul>

      <button
        class="w-full border-t border-surface-border py-2.5 text-sm font-medium text-primary-600 hover:bg-surface-muted"
        @click="goToAll"
      >
        {{ t('notifications.viewAll') }}
      </button>
    </div>
  </div>
</template>
