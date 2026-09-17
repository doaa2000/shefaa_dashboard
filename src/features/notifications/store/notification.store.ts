import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { AppNotification } from '../domain/notification.models'

export const useNotificationStore = defineStore('notifications', () => {
  const service = container.notificationService

  const items = ref<AppNotification[]>([])
  const loading = ref(false)
  const error = ref<AppError | null>(null)

  const unreadCount = computed(() => items.value.filter((n) => !n.isRead).length)

  async function fetch(): Promise<void> {
    loading.value = true
    error.value = null
    const result = await service.list()
    loading.value = false
    if (isOk(result)) items.value = result.value.items
    else error.value = result.error
  }

  async function markAsRead(id: number): Promise<void> {
    const target = items.value.find((n) => n.id === id)
    if (!target || target.isRead) return

    // Shown as read straight away. The server is the record, but making the
    // doctor wait for a round trip to watch a dot disappear is the kind of
    // delay that makes a page feel broken.
    const previous = { ...target }
    Object.assign(target, { isRead: true, readAt: new Date().toISOString() })

    const result = await service.markAsRead(id)
    if (!isOk(result)) Object.assign(target, previous)
  }

  async function markAllAsRead(): Promise<void> {
    const previous = items.value.map((n) => ({ ...n }))
    const now = new Date().toISOString()
    items.value = items.value.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now }))

    const result = await service.markAllAsRead()
    if (!isOk(result)) items.value = previous
  }

  /**
   * Refreshes when a notification actually arrives.
   *
   * The message comes from this app's own service worker, which is told about
   * a push before anything is drawn -- so there is no second connection to
   * keep open and nothing to subscribe to. A page that is not open misses
   * nothing: it reads the list when it opens.
   */
  function watchPush(): () => void {
    if (!('serviceWorker' in navigator)) return () => {}

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'push') void fetch()
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }

  return { items, loading, error, unreadCount, fetch, markAsRead, markAllAsRead, watchPush }
})
