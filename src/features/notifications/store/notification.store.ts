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

  /**
   * The list and the count, asked for together.
   *
   * It re-reads as much as is already on screen rather than the first page.
   * A doctor who opened three pages of history and then had a booking arrive
   * would otherwise watch the list collapse back to one -- the arrival would
   * undo the reading.
   *
   * `silent` is what separates a refresh from a first load. Raising the
   * spinner replaces the whole list with it, which is right when there is
   * nothing to replace and wrong when the page is sitting there being read.
   */
  async function read(silent: boolean): Promise<void> {
    if (!silent) loading.value = true
    error.value = null

    const held = Math.max(NOTIFICATIONS_PAGE_SIZE, items.value.length)
    const listing = service.list(0, held)
    const counting = refreshCount()
    const result = await listing
    await counting

    loading.value = false
    if (isOk(result)) {
      items.value = result.value
      hasMore.value = result.value.length === held
    } else {
      error.value = result.error
    }
  }

  /** Opening the screen. */
  function fetch(): Promise<void> {
    return read(false)
  }

  /** Something arrived, or the tab came back. */
  function refresh(): Promise<void> {
    return read(true)
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
   * Nothing runs in the background: no timer, no connection held open. The
   * page learns about a message the same way the doctor does -- the browser
   * is told, and this app's own service worker passes that on to whichever
   * tab is open. Which means browser notifications have to be turned on for
   * the bell to move by itself; that is the permission the settings page
   * asks for.
   *
   * A read when the tab comes back is the second half of it, and costs
   * nothing to keep: a push that arrived while the browser was closed, or one
   * the machine slept through, is caught the moment the doctor looks at the
   * page again.
   */
  function keepFresh(): () => void {
    const stops: Array<() => void> = []

    // A message about a booking is two rows arriving together often enough to
    // be worth collapsing, and the refresh behind this is two requests.
    let pending: ReturnType<typeof setTimeout> | null = null
    const refreshSoon = () => {
      if (pending) clearTimeout(pending)
      pending = setTimeout(() => {
        pending = null
        void refresh()
      }, 400)
    }
    stops.push(() => {
      if (pending) clearTimeout(pending)
      pending = null
    })

    if ('serviceWorker' in navigator) {
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === 'push') refreshSoon()
      }
      navigator.serviceWorker.addEventListener('message', onMessage)
      stops.push(() => navigator.serviceWorker.removeEventListener('message', onMessage))
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') refreshSoon()
    }
    document.addEventListener('visibilitychange', onVisibility)
    stops.push(() => document.removeEventListener('visibilitychange', onVisibility))

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
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    keepFresh,
  }
})
