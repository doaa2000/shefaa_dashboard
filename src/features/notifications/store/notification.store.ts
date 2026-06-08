import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { container } from '@/app/providers/container'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { AppNotification } from '../domain/notification.models'

export const useNotificationStore = defineStore('notifications', () => {
  const service = container.notificationService
  const auth = useAuthStore()

  const items = ref<AppNotification[]>([])
  const loading = ref(false)
  const error = ref<AppError | null>(null)
  let unsubscribe: (() => void) | null = null

  const unreadCount = computed(() => items.value.filter((n) => !n.isRead).length)

  async function fetch(): Promise<void> {
    if (!auth.doctorId) return
    loading.value = true
    error.value = null
    const result = await service.list(auth.doctorId)
    loading.value = false
    if (isOk(result)) items.value = result.value.items
    else error.value = result.error
  }

  function startRealtime(): void {
    if (!auth.doctorId || unsubscribe) return
    unsubscribe = service.subscribe(auth.doctorId, (n) => {
      items.value = [n, ...items.value]
    })
  }

  function stopRealtime(): void {
    unsubscribe?.()
    unsubscribe = null
  }

  async function markAsRead(id: string): Promise<void> {
    const result = await service.markAsRead(id)
    if (isOk(result)) patchLocal(result.value)
  }

  async function markAllAsRead(): Promise<void> {
    if (!auth.doctorId) return
    const result = await service.markAllAsRead(auth.doctorId)
    if (isOk(result)) items.value = items.value.map((n) => ({ ...n, isRead: true }))
  }

  async function remove(id: string): Promise<void> {
    const result = await service.remove(id)
    if (isOk(result)) items.value = items.value.filter((n) => n.id !== id)
  }

  function patchLocal(updated: AppNotification): void {
    const idx = items.value.findIndex((n) => n.id === updated.id)
    if (idx !== -1) items.value[idx] = updated
  }

  return {
    items,
    loading,
    error,
    unreadCount,
    fetch,
    startRealtime,
    stopRealtime,
    markAsRead,
    markAllAsRead,
    remove,
  }
})
