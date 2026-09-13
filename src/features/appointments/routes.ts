import type { RouteRecordRaw } from 'vue-router'

export const appointmentRoutes: RouteRecordRaw[] = [
  {
    path: '/queue',
    name: 'queue',
    component: () => import('./presentation/pages/QueuePage.vue'),
    meta: { titleKey: 'nav.queue' },
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('./presentation/pages/AppointmentsListPage.vue'),
    meta: { titleKey: 'nav.appointments' },
  },
]
