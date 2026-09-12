import type { RouteRecordRaw } from 'vue-router'

export const appointmentRoutes: RouteRecordRaw[] = [
  {
    path: '/queue',
    name: 'queue',
    component: () => import('./presentation/pages/QueuePage.vue'),
    meta: { title: "Today's queue" },
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('./presentation/pages/AppointmentsListPage.vue'),
    meta: { title: 'Appointments' },
  },
]
