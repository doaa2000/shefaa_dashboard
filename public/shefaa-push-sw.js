/*
 * The service worker that receives browser notifications.
 *
 * Deliberately plain: no Firebase SDK, no importScripts from a CDN. Firebase's
 * own messaging worker only needs to exist so that a push subscription has
 * somewhere to arrive; everything it would do for us is the twenty lines
 * below, and a service worker that fetches its code from another origin at
 * install time is one more thing that can be blocked, go stale, or change
 * under us.
 *
 * The page hands this registration to getToken(), so the subscription and this
 * file are the same worker.
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    // A push with a body we cannot read is not worth guessing at.
    return
  }

  // Firebase puts the message under `notification` when it was sent with one,
  // and everything else under `data`. Reading both means a data-only message
  // still shows something rather than nothing.
  const notification = payload.notification ?? {}
  const data = payload.data ?? {}

  const title = notification.title ?? data.title
  if (!title) return

  // Tell any open dashboard, so its list and its unread count catch up
  // without a second connection held open for the purpose.
  const tellOpenTabs = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => {
      for (const client of clients) client.postMessage({ type: 'push', data })
    })

  event.waitUntil(
    Promise.all([
      tellOpenTabs,
      self.registration.showNotification(title, {
        body: notification.body ?? data.body ?? '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        // Keyed on the booking so a second message about the same appointment
        // replaces the first rather than stacking under it.
        tag: data.booking_id ? `booking-${data.booking_id}` : undefined,
        data,
      }),
    ]),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Whichever screen the message is about. Falls back to the dashboard, which
  // is never the wrong place to land.
  const target = event.notification.data?.kind === 'booking_created_doctor'
    ? '/appointments'
    : '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Reuse a tab that is already open rather than piling up dashboards.
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
