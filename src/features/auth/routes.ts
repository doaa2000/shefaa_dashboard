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
    // Not public: this is for somebody already signed in, either because they
    // were handed a password or because they came from settings to replace
    // one. A signed-out visitor belongs at the login screen.
    path: '/change-password',
    name: 'change-password',
    component: () => import('./presentation/pages/ChangePasswordPage.vue'),
    meta: { layout: 'auth', titleKey: 'nav.changePassword' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('./presentation/pages/ForgotPasswordPage.vue'),
    meta: { layout: 'auth', public: true, titleKey: 'nav.resetPassword' },
  },
  {
    // Neither public nor private. The emailed link signs the visitor in on
    // the way here, so they arrive with a session that a public route would
    // send on to the dashboard -- before the new password was ever set. And
    // a link that did not work arrives with no session at all, which a
    // private route would bounce to the login screen without saying why.
    // The page itself tells the two apart.
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('./presentation/pages/ResetPasswordPage.vue'),
    meta: { layout: 'auth', recovery: true, titleKey: 'auth.newPasswordTitle' },
  },
]
