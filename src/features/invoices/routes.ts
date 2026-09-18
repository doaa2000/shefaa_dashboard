import type { RouteRecordRaw } from 'vue-router'

export const invoiceRoutes: RouteRecordRaw[] = [
  {
    path: '/invoices',
    name: 'invoices',
    component: () => import('./presentation/pages/InvoicesPage.vue'),
    meta: { titleKey: 'nav.invoices' },
  },
]
