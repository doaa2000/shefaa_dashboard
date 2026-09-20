import type { RouteRecordRaw } from 'vue-router'

export const scheduleRoutes: RouteRecordRaw[] = [
  {
    path: '/schedule',
    name: 'schedule',
    component: () => import('./presentation/pages/SchedulePage.vue'),
    meta: { titleKey: 'nav.schedule' },
  },
]
