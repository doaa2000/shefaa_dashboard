import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { INotificationRepository } from '../domain/notification.repository'
import type { NotificationListResult } from '../domain/notification.models'

export class NotificationService {
  constructor(private readonly repo: INotificationRepository) {}

  list(limit?: number): Promise<Result<NotificationListResult, AppError>> {
    return this.repo.list(limit)
  }

  markAsRead(id: number): Promise<Result<void, AppError>> {
    return this.repo.markAsRead(id)
  }

  markAllAsRead(): Promise<Result<void, AppError>> {
    return this.repo.markAllAsRead()
  }
}
