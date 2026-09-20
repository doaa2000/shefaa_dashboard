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
   * How long a tab must sit in the background before its live connection is
   * given up.
   *
   * An open socket is not free: it exchanges a keep-alive roughly twice a
   * minute whether or not anything happens, which over a working day is far
   * more traffic than the bookings it carries. Dropping it while nobody is
   * looking costs a few frames to rejoin later, so the wait only has to be
   * long enough that flicking to another tab and back does not pay that price
   * over and over.
   */
  const BACKGROUND_GRACE_MS = 60_000

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
        void refresh()
      }, 400)
    }
    stops.push(() => {
      if (pending) clearTimeout(pending)
      pending = null
    })

    // The live connection, held only while somebody is looking at the page.
    let stopLive: (() => void) | null = null
    let dropping: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (stopLive || !userId) return
      stopLive = service.watch(userId, refreshSoon)
    }

    const disconnect = () => {
      stopLive?.()
      stopLive = null
    }

    const cancelDrop = () => {
      if (dropping) clearTimeout(dropping)
      dropping = null
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (!dropping && stopLive) {
          dropping = setTimeout(() => {
            dropping = null
            disconnect()
          }, BACKGROUND_GRACE_MS)
        }
        return
      }

      cancelDrop()
      // Nothing was heard while the socket was down, so coming back has to
      // ask rather than assume. This is the whole reason the reconnect is
      // paired with a read: without it the bell would show whatever it held
      // when the doctor looked away.
      const wasDown = stopLive === null
      connect()
      if (wasDown) refreshSoon()
    }

    // A dashboard opened into a background tab -- a middle click, a restored
    // session -- should not hold a socket nobody is watching either. It gets
    // one when it is first looked at, and the read that comes with it.
    if (document.visibilityState !== 'hidden') connect()
    document.addEventListener('visibilitychange', onVisibility)
    stops.push(() => {
      document.removeEventListener('visibilitychange', onVisibility)
      cancelDrop()
      disconnect()
    })

    // Left running in the background as well. It is the only thing still
    // listening once the socket is dropped, and it costs nothing to keep:
    // the message comes from this app's own service worker, not over a
    // connection held open for it.
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
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    watch,
  }
})
