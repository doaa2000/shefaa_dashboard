import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { AppNotification, NotificationListResult } from './notification.models'

export interface INotificationRepository {
  list(doctorId: string, limit?: number): Promise<Result<NotificationListResult, AppError>>
  markAsRead(id: string): Promise<Result<AppNotification, AppError>>
  markAllAsRead(doctorId: string): Promise<Result<void, AppError>>
  remove(id: string): Promise<Result<void, AppError>>
  subscribe(doctorId: string, onInsert: (n: AppNotification) => void): () => void
}
