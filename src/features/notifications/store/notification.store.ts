import { ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { NOTIFICATIONS_PAGE_SIZE, type AppNotification } from '../domain/notification.models'

export const useNotificationStore = defineStore('notifications', () => {
  const service = container.notificationService

  const items = ref<AppNotification[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<AppError | null>(null)

  /**
   * Counted in the database, not here.
   *
   * It used to be `items.filter(n => !n.isRead).length`, which is the right
   * answer only while the whole history fits in one page. Past that the badge
   * quietly undercounts -- and a badge that is wrong is worse than no badge,
   * because it is believed.
   */
  const unreadCount = ref(0)

  /** Whether the last page came back full, which is the only hint of more. */
  const hasMore = ref(false)

  async function refreshCount(): Promise<void> {
    const result = await service.countUnread()
    if (isOk(result)) unreadCount.value = result.value
  }

  /** First page, and the count, asked for together. */
  async function fetch(): Promise<void> {
    loading.value = true
    error.value = null

    const listing = service.list(0)
    const counting = refreshCount()
    const result = await listing
    await counting

    loading.value = false
    if (isOk(result)) {
      items.value = result.value
      hasMore.value = result.value.length === NOTIFICATIONS_PAGE_SIZE
    } else {
      error.value = result.error
    }
  }

  async function loadMore(): Promise<void> {
    if (loadingMore.value || !hasMore.value) return

    loadingMore.value = true
    const result = await service.list(items.value.length)
    loadingMore.value = false

    if (!isOk(result)) {
      error.value = result.error
      return
    }

    // A message delivered between the two reads shifts every later row down by
    // one, which would hand back a row already on screen. Keying by id rather
    // than trusting the offset costs one pass and cannot produce a duplicate.
    const known = new Set(items.value.map((n) => n.id))
    items.value = [...items.value, ...result.value.filter((n) => !known.has(n.id))]
    hasMore.value = result.value.length === NOTIFICATIONS_PAGE_SIZE
  }

  async function markAsRead(id: number): Promise<void> {
    const target = items.value.find((n) => n.id === id)
    if (!target || target.isRead) return

    // Shown as read straight away. The server is the record, but making the
    // doctor wait for a round trip to watch a dot disappear is the kind of
    // delay that makes a page feel broken.
    const previous = { ...target }
    const previousCount = unreadCount.value
    Object.assign(target, { isRead: true, readAt: new Date().toISOString() })
    unreadCount.value = Math.max(0, unreadCount.value - 1)

    const result = await service.markAsRead(id)
    if (!isOk(result)) {
      Object.assign(target, previous)
      unreadCount.value = previousCount
    }
  }

  async function markAllAsRead(): Promise<void> {
    const previous = items.value.map((n) => ({ ...n }))
    const previousCount = unreadCount.value
    const now = new Date().toISOString()
    items.value = items.value.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now }))
    // The function behind this marks every unread message, including the ones
    // below the page on screen, so the count goes to zero rather than down by
    // the number of rows that happen to be drawn.
    unreadCount.value = 0

    const result = await service.markAllAsRead()
    if (!isOk(result)) {
      items.value = previous
      unreadCount.value = previousCount
    }
  }

  /**
   * Keeps an open dashboard current.
   *
   * Two sources, because neither covers the other. Postgres tells a signed-in
   * page about its own rows over the socket the app already holds -- no
   * permission to ask for, and it works in a browser that cannot do
   * notifications at all. The service worker message covers the case the
   * socket does not: a push that arrived while this tab was in the background
   * and the connection had been dropped.
   *
   * Both end in the same refresh, and a refresh is cheap: one page and one
   * count.
   */
  function watch(userId: string | null): () => void {
    const stops: Array<() => void> = []

    // Marking read is itself an update to this table, so a doctor clearing
    // thirty messages hears thirty times about work they just did. Waiting a
    // moment turns any burst into the one refresh it deserves; a single
    // arrival is delayed by less than anyone can notice.
    let pending: ReturnType<typeof setTimeout> | null = null
    const refreshSoon = () => {
      if (pending) clearTimeout(pending)
      pending = setTimeout(() => {
        pending = null
        void fetch()
      }, 400)
    }
    stops.push(() => {
      if (pending) clearTimeout(pending)
      pending = null
    })

    if (userId) stops.push(service.watch(userId, refreshSoon))

    if ('serviceWorker' in navigator) {
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === 'push') refreshSoon()
      }
      navigator.serviceWorker.addEventListener('message', onMessage)
      stops.push(() => navigator.serviceWorker.removeEventListener('message', onMessage))
    }

    return () => stops.forEach((stop) => stop())
  }

  return {
    items,
    loading,
    loadingMore,
    error,
    unreadCount,
    hasMore,
    fetch,
    loadMore,
    markAsRead,
    markAllAsRead,
    watch,
  }
})
