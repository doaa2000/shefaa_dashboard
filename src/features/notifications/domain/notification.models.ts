/**
 * What produced a notification. It is not shown as a label -- the title
 * already says what happened -- but it decides the icon, and where tapping
 * one should go.
 */
export type NotificationKind =
  | 'booking_created_doctor'
  | 'booking_cancelled_doctor'
  | 'booking_rescheduled_doctor'
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_rescheduled'
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

/**
 * How many messages one read brings back.
 *
 * Kept in the domain because the list query and the screen that asks for the
 * next page both need it, and a page size the two disagree about is a list
 * that either repeats rows or skips them.
 */
export const NOTIFICATIONS_PAGE_SIZE = 50

/** Which screen answers "what is this about". */
export function routeFor(kind: string): string {
  return kind.startsWith('booking_') ? '/appointments' : '/'
}
