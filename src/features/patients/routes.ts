import type { RouteRecordRaw } from 'vue-router'

export const patientRoutes: RouteRecordRaw[] = [
  {
    path: '/patients',
    name: 'patients',
    component: () => import('./presentation/pages/PatientsListPage.vue'),
    meta: { title: 'Patients' },
  },
  {
    path: '/patients/:id',
    name: 'patient-detail',
    component: () => import('./presentation/pages/PatientDetailPage.vue'),
    meta: { title: 'Patient' },
  },
]
