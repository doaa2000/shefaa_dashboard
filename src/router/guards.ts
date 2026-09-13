import type { Router } from 'vue-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { t } from '@/app/i18n'

/**
 * Registers global navigation guards:
 *  - ensures the auth session is initialized before the first navigation
 *  - redirects unauthenticated users away from protected routes
 *  - redirects authenticated users away from public (auth) routes
 *  - sets the document title from route meta
 */
export function registerGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    if (!auth.initialized) await auth.initialize()

    const isPublic = to.meta.public === true

    if (!isPublic && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (isPublic && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }

    return true
  })

  router.afterEach((to) => {
    const key = to.meta.titleKey as string | undefined
    const name = t('common.appName')
    document.title = key ? `${t(key)} · ${name}` : name
  })
}
