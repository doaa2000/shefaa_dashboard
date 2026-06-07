import type { RouteRecordRaw } from 'vue-router'

export const appointmentRoutes: RouteRecordRaw[] = [
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('./presentation/pages/AppointmentsListPage.vue'),
    meta: { title: 'Appointments' },
  },
]
