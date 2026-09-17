import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { Tables } from '@/core/types/database.types'
import type { INotificationRepository } from '../domain/notification.repository'
import type { AppNotification, NotificationListResult } from '../domain/notification.models'

function toNotification(row: Tables<'notifications'>): AppNotification {
  const data = (row.data ?? {}) as Record<string, unknown>
  const bookingId = Number(data.booking_id)

  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    bookingId: Number.isFinite(bookingId) ? bookingId : null,
    sentAt: row.sent_at as string,
    readAt: row.read_at,
    isRead: row.read_at !== null,
  }
}

export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  /**
   * No filter by doctor: the table's policy already answers with this
   * account's rows and nothing else, and a filter written here as well would
   * be a second copy of that rule, free to drift from it.
   */
  async list(limit = 50): Promise<Result<NotificationListResult, AppError>> {
    try {
      const { data, error } = await this.client
        .from('notifications')
        .select('*')
        // Undelivered rows are the queue's business, not the reader's. A
        // reminder scheduled for tomorrow is not news today.
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(limit)
      if (error) return err(normalizeError(error))

      const items = data.map(toNotification)
      return ok({ items, unreadCount: items.filter((n) => !n.isRead).length })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async markAsRead(id: number): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.rpc('mark_notification_read', { p_id: id })
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async markAllAsRead(): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.rpc('mark_all_notifications_read')
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }
}
