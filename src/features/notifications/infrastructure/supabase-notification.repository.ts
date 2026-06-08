import type { AppSupabaseClient } from '@/core/http/supabase.client'
import { type Result, ok, err } from '@/core/result'
import { type AppError, normalizeError } from '@/core/errors'
import type { Tables } from '@/core/types/database.types'
import type { INotificationRepository } from '../domain/notification.repository'
import type {
  AppNotification,
  NotificationListResult,
  NotificationType,
} from '../domain/notification.models'

function toNotification(row: Tables<'notifications'>): AppNotification {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  }
}

export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async list(doctorId: number, limit = 30): Promise<Result<NotificationListResult, AppError>> {
    try {
      const { data, error } = await this.client
        .from('notifications')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) return err(normalizeError(error))
      const items = data.map(toNotification)
      return ok({ items, unreadCount: items.filter((n) => !n.isRead).length })
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async markAsRead(id: string): Promise<Result<AppNotification, AppError>> {
    try {
      const { data, error } = await this.client
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select('*')
        .single()
      if (error) return err(normalizeError(error))
      return ok(toNotification(data))
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async markAllAsRead(doctorId: number): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client
        .from('notifications')
        .update({ is_read: true })
        .eq('doctor_id', doctorId)
        .eq('is_read', false)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client.from('notifications').delete().eq('id', id)
      if (error) return err(normalizeError(error))
      return ok(undefined)
    } catch (e) {
      return err(normalizeError(e))
    }
  }

  subscribe(doctorId: number, onInsert: (n: AppNotification) => void): () => void {
    const channel = this.client
      .channel(`notifications:${doctorId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `doctor_id=eq.${doctorId}` },
        (payload) => onInsert(toNotification(payload.new as Tables<'notifications'>)),
      )
      .subscribe()
    return () => {
      void this.client.removeChannel(channel)
    }
  }
}
