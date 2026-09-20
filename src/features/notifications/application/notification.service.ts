import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'
import type { INotificationRepository } from '../domain/notification.repository'
import type { AppNotification } from '../domain/notification.models'

export class NotificationService {
  constructor(private readonly repo: INotificationRepository) {}

  list(offset?: number): Promise<Result<AppNotification[], AppError>> {
    return this.repo.list(offset)
  }

  countUnread(): Promise<Result<number, AppError>> {
    return this.repo.countUnread()
  }

  markAsRead(id: number): Promise<Result<void, AppError>> {
    return this.repo.markAsRead(id)
  }

  markAllAsRead(): Promise<Result<void, AppError>> {
    return this.repo.markAllAsRead()
  }

  watch(userId: string, onChange: () => void): () => void {
    return this.repo.watch(userId, onChange)
  }
}
