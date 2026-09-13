import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./presentation/pages/LoginPage.vue'),
    meta: { layout: 'auth', public: true, titleKey: 'nav.signIn' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('./presentation/pages/RegisterPage.vue'),
    meta: { layout: 'auth', public: true, titleKey: 'nav.createAccount' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('./presentation/pages/ForgotPasswordPage.vue'),
    meta: { layout: 'auth', public: true, titleKey: 'nav.resetPassword' },
  },
]
