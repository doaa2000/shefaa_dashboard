import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { AppNotification } from './notification.models'

/**
 * The doctor's own notifications.
 *
 * There is no remove: the row is also the delivery record, and it is what a
 * reminder's dedupe key points at -- deleting one for an appointment still to
 * come would have the next sweep write it again, so "clear" would mean "send
 * it twice".
 */
export interface INotificationRepository {
  /**
   * History, newest first. `offset` is how many are already held; `limit`
   * defaults to one page but is raised to re-read everything on screen at
   * once, which is what a refresh needs.
   */
  list(offset?: number, limit?: number): Promise<Result<AppNotification[], AppError>>

  /**
   * The bell's number, counted in the database over every message rather than
   * over the page of them a screen happens to hold.
   */
  countUnread(): Promise<Result<number, AppError>>

  markAsRead(id: number): Promise<Result<void, AppError>>
  markAllAsRead(): Promise<Result<void, AppError>>

}
