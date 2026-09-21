import type { Router } from 'vue-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { t } from '@/app/i18n'

/**
 * Registers global navigation guards:
 *  - ensures the auth session is initialized before the first navigation
 *  - redirects unauthenticated users away from protected routes
 *  - redirects authenticated users away from public (auth) routes
 *  - holds a doctor on the change-password screen while their password is one
 *    an admin handed them
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

    // A first password is read down a phone or sent in a message, so it has
    // been somewhere the doctor does not control before they ever use it.
    // Nothing else opens until they have chosen their own -- otherwise the
    // handed-over one quietly becomes the permanent one.
    //
    // `to.name` is checked so this does not redirect the screen to itself,
    // which is a navigation loop rather than a guard.
    if (auth.isAuthenticated && auth.mustChangePassword && to.name !== 'change-password') {
      return { name: 'change-password', query: { redirect: to.fullPath } }
    }

    return true
  })

  router.afterEach((to) => {
    const key = to.meta.titleKey as string | undefined
    const name = t('common.appName')
    document.title = key ? `${t(key)} · ${name}` : name
  })
}
