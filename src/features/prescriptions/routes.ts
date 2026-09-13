import type { RouteRecordRaw } from 'vue-router'

export const prescriptionRoutes: RouteRecordRaw[] = [
  {
    path: '/prescriptions',
    name: 'prescriptions',
    component: () => import('./presentation/pages/PrescriptionsListPage.vue'),
    meta: { titleKey: 'nav.prescriptions' },
  },
]
