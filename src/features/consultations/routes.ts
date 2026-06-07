import type { RouteRecordRaw } from 'vue-router'

export const consultationRoutes: RouteRecordRaw[] = [
  {
    path: '/consultations',
    name: 'consultations',
    component: () => import('./presentation/pages/ConsultationsListPage.vue'),
    meta: { title: 'Consultations' },
  },
]
