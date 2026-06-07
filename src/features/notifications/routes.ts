import type { RouteRecordRaw } from 'vue-router'

export const notificationRoutes: RouteRecordRaw[] = [
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('./presentation/pages/NotificationsPage.vue'),
    meta: { title: 'Notifications' },
  },
]
