import type { RouteRecordRaw } from 'vue-router'

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('./presentation/pages/DashboardPage.vue'),
    meta: { title: 'Dashboard' },
  },
]
