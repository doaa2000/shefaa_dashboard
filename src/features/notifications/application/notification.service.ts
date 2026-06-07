import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { INotificationRepository } from '../domain/notification.repository'
import type { AppNotification, NotificationListResult } from '../domain/notification.models'

export class NotificationService {
  constructor(private readonly repo: INotificationRepository) {}

  list(doctorId: string, limit?: number): Promise<Result<NotificationListResult, AppError>> {
    return this.repo.list(doctorId, limit)
  }

  markAsRead(id: string): Promise<Result<AppNotification, AppError>> {
    return this.repo.markAsRead(id)
  }

  markAllAsRead(doctorId: string): Promise<Result<void, AppError>> {
    return this.repo.markAllAsRead(doctorId)
  }

  remove(id: string): Promise<Result<void, AppError>> {
    return this.repo.remove(id)
  }

  subscribe(doctorId: string, onInsert: (n: AppNotification) => void): () => void {
    return this.repo.subscribe(doctorId, onInsert)
  }
}
