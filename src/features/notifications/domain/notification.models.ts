export type NotificationType = 'appointment' | 'system' | 'message' | 'reminder'

export interface AppNotification {
  id: string
  doctorId: number
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
