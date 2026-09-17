import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { NotificationListResult } from './notification.models'

/**
 * The doctor's own notifications.
 *
 * There is no remove: the row is also the delivery record, and it is what a
 * reminder's dedupe key points at -- deleting one for an appointment still to
 * come would have the next sweep write it again, so "clear" would mean "send
 * it twice".
 */
export interface INotificationRepository {
  list(limit?: number): Promise<Result<NotificationListResult, AppError>>
  markAsRead(id: number): Promise<Result<void, AppError>>
  markAllAsRead(): Promise<Result<void, AppError>>
}
