import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { Tables } from '@/core/types/database.types'
import type { INotificationRepository } from '../domain/notification.repository'
import { NOTIFICATIONS_PAGE_SIZE, type AppNotification } from '../domain/notification.models'

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
  async list(offset = 0): Promise<Result<AppNotification[], AppError>> {
    try {
      const { data, error } = await this.client
        .from('notifications')
        .select('*')
        // Undelivered rows are the queue's business, not the reader's. A
        // reminder scheduled for tomorrow is not news today.
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        // A page of history, not all of it. Two messages per booking means a
        // busy clinic passes a hundred inside a month, and this is re-read
        // every time the dashboard is opened and every time one arrives.
        .range(offset, offset + NOTIFICATIONS_PAGE_SIZE - 1)
      if (error) return err(normalizeError(error))

      return ok(data.map(toNotification))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  /**
   * The bell's number.
   *
   * Asked for separately because the list is capped, and a count taken from a
   * capped list is wrong in exactly the case that matters: a doctor with more
   * history than one page of it. `head` means the rows are never sent -- only
   * the count comes back.
   */
  async countUnread(): Promise<Result<number, AppError>> {
    try {
      const { count, error } = await this.client
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null)
        .not('sent_at', 'is', null)
      if (error) return err(normalizeError(error))

      return ok(count ?? 0)
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

  /**
   * The open page, told by Postgres.
   *
   * Browser push was the only thing that used to bring news to a dashboard
   * already open, and it is not something we control: it needs a permission
   * the doctor may have refused, a browser that supports it, and a Firebase
   * key set for the deployment. Missing any of those, the bell stopped
   * counting until the page was reloaded.
   *
   * Both events matter. A booking writes the row at once, with sent_at null --
   * queued, not delivered, and the list does not show it yet; it becomes news
   * when the sender fills sent_at, which is an update. Listening for inserts
   * alone would hear the earliest possible moment and still find nothing to
   * draw.
   *
   * The filter is for the socket's sake rather than for privacy: row-level
   * security is what decides which rows reach a subscriber, exactly as it
   * decides which rows a query returns.
   */
  watch(userId: string, onChange: () => void): () => void {
    const channel = this.client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => onChange(),
      )
      .subscribe()

    return () => {
      void this.client.removeChannel(channel)
    }
  }
}
