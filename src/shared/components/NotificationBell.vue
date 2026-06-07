<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { onClickOutside } from '@vueuse/core'
import { useNotificationStore } from '@/features/notifications/store/notification.store'
import { formatDateTime } from '@/shared/utils/datetime'

const router = useRouter()
const store = useNotificationStore()
const { items, unreadCount } = storeToRefs(store)

const open = ref(false)
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (open.value = false))

onMounted(() => {
  void store.fetch()
  store.startRealtime()
})

function goToAll() {
  open.value = false
  void router.push('/notifications')
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      class="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-surface-muted"
      aria-label="Notifications"
      @click="open = !open"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-elevated"
    >
      <header class="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <p class="text-sm font-semibold text-slate-800">Notifications</p>
        <button class="text-xs font-medium text-primary-600 hover:underline" @click="store.markAllAsRead()">
          Mark all read
        </button>
      </header>
      <ul class="max-h-80 divide-y divide-surface-border overflow-y-auto">
        <li v-if="items.length === 0" class="px-4 py-6 text-center text-sm text-slate-400">
          No notifications
        </li>
        <li
          v-for="n in items.slice(0, 6)"
          :key="n.id"
          class="px-4 py-3"
          :class="!n.isRead ? 'bg-primary-50/40' : ''"
        >
          <p class="text-sm font-medium text-slate-800">{{ n.title }}</p>
          <p v-if="n.body" class="text-xs text-slate-500">{{ n.body }}</p>
          <p class="mt-0.5 text-[11px] text-slate-400">{{ formatDateTime(n.createdAt) }}</p>
        </li>
      </ul>
      <button class="w-full border-t border-surface-border py-2.5 text-sm font-medium text-primary-600 hover:bg-surface-muted" @click="goToAll">
        View all
      </button>
    </div>
  </div>
</template>
