import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { authRoutes } from '@/features/auth/routes'
import { dashboardRoutes } from '@/features/dashboard/routes'
import { appointmentRoutes } from '@/features/appointments/routes'
import { patientRoutes } from '@/features/patients/routes'
import { consultationRoutes } from '@/features/consultations/routes'
import { prescriptionRoutes } from '@/features/prescriptions/routes'
import { reportRoutes } from '@/features/reports/routes'
import { paymentRoutes } from '@/features/payments/routes'
import { invoiceRoutes } from '@/features/invoices/routes'
import { notificationRoutes } from '@/features/notifications/routes'
import { scheduleRoutes } from '@/features/schedule/routes'
import { settingsRoutes } from '@/features/settings/routes'
import { registerGuards } from './guards'

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...dashboardRoutes,
  ...appointmentRoutes,
  ...patientRoutes,
  ...consultationRoutes,
  ...prescriptionRoutes,
  ...reportRoutes,
  ...paymentRoutes,
  ...invoiceRoutes,
  ...notificationRoutes,
  ...scheduleRoutes,
  ...settingsRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/shared/components/NotFoundPage.vue'),
    meta: { titleKey: 'nav.notFound' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

registerGuards(router)
