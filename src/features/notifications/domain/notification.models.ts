import type { NotificationType } from '@/core/types/database.types'

export type { NotificationType }

export interface AppNotification {
  id: string
  doctorId: string
  type: NotificationType
  title: string
  body: string | null
  isRead: boolean
  entityType: string | null
  entityId: string | null
  createdAt: string
}

export interface NotificationListResult {
  items: AppNotification[]
  unreadCount: number
}
