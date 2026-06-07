import type { RouteRecordRaw } from 'vue-router'

export const reportRoutes: RouteRecordRaw[] = [
  {
    path: '/reports',
    name: 'reports',
    component: () => import('./presentation/pages/ReportsPage.vue'),
    meta: { title: 'Reports' },
  },
]
