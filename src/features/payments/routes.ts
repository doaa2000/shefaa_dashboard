import type { RouteRecordRaw } from 'vue-router'

export const paymentRoutes: RouteRecordRaw[] = [
  {
    path: '/payments',
    name: 'payments',
    component: () => import('./presentation/pages/PaymentsListPage.vue'),
    meta: { title: 'Payments' },
  },
]
