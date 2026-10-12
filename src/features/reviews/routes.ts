import type { RouteRecordRaw } from 'vue-router'

export const reviewRoutes: RouteRecordRaw[] = [
  {
    path: '/reviews',
    name: 'reviews',
    component: () => import('./presentation/pages/ReviewsPage.vue'),
    meta: { titleKey: 'nav.reviews' },
  },
]
