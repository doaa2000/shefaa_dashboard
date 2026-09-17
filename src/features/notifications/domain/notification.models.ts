/**
 * What produced a notification. It is not shown as a label -- the title
 * already says what happened -- but it decides the icon, and where tapping
 * one should go.
 */
export type NotificationKind =
  | 'booking_created_doctor'
  | 'booking_cancelled_doctor'
  | 'booking_created'
  | 'booking_cancelled'
  | 'reminder_day'
  | 'reminder_hour'

export interface AppNotification {
  id: number
  kind: NotificationKind | string
  title: string
  body: string
  /** The appointment this is about, when there is one. */
  bookingId: number | null
  /** When it was delivered. The list never shows anything undelivered. */
  sentAt: string
  readAt: string | null
  isRead: boolean
}

export interface NotificationListResult {
  items: AppNotification[]
  unreadCount: number
}

/** Which screen answers "what is this about". */
export function routeFor(kind: string): string {
  return kind.startsWith('booking_') ? '/appointments' : '/'
}
