import type { FirebaseApp } from 'firebase/app'
import type { Messaging } from 'firebase/messaging'
import { env } from '@/core/config/env'
import { isOk } from '@/core/result'
import type { IPushRepository } from '../domain/push.repository'

/** What the doctor sees on the settings card, and what the button may do. */
export type PushState =
  /** No Firebase settings in this deployment, or a browser without push. */
  | 'unavailable'
  /** Never asked. The button asks. */
  | 'off'
  /** Asked and granted; this browser is registered. */
  | 'on'
  /** Asked and refused. The browser will not ask again from here -- only the
   *  address-bar padlock can undo it, so the card has to say so. */
  | 'blocked'

const SERVICE_WORKER_URL = '/shefaa-push-sw.js'

/**
 * Browser notifications for the doctor.
 *
 * The dashboard is a web page, so there is no app in a pocket to notify. This
 * subscribes the browser instead, and hands the resulting token to the same
 * table the patient app writes to -- from the sender's point of view a doctor's
 * browser and a patient's phone are the same thing.
 *
 * Every entry point tolerates being unavailable. A deployment with no Firebase
 * settings, a browser with no push support, an insecure origin, a refused
 * prompt: all of them end with notifications simply not on, never with a
 * broken dashboard.
 */
export class PushService {
  constructor(private readonly repository: IPushRepository) {}

  private app: FirebaseApp | null = null
  private messaging: Messaging | null = null

  /** The token the server is known to hold, kept so signing out can take it
   *  back after the session -- and the permission to read it -- are gone. */
  private registered: string | null = null

  async state(): Promise<PushState> {
    if (!this.supportedHere()) return 'unavailable'

    switch (Notification.permission) {
      case 'granted':
        return 'on'
      case 'denied':
        return 'blocked'
      default:
        return 'off'
    }
  }

  /**
   * Asks, if it has not been asked before, and registers on a yes.
   *
   * Called from a click. Browsers increasingly refuse a permission prompt that
   * did not follow one, and Safari always has.
   */
  async enable(): Promise<PushState> {
    if (!this.supportedHere()) return 'unavailable'

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return permission === 'denied' ? 'blocked' : 'off'
    }

    await this.registerToken()
    return 'on'
  }

  /**
   * Registers without asking, and only if permission is already there.
   *
   * Runs on every sign-in: the token belongs to the account that is signed in,
   * so a browser two doctors share must hand it to whoever is here now. Silent
   * because a prompt on the way in is a prompt nobody expected.
   */
  async resume(): Promise<void> {
    // Permission first, and only then anything that would pull Firebase in: a
    // doctor who has never turned notifications on should not pay to download
    // the library that would have sent them.
    if (!this.supportedHere()) return
    if (Notification.permission !== 'granted') return
    await this.registerToken()
  }

  /** Called before signing out, while the session can still prove who owns it. */
  async release(): Promise<void> {
    const token = this.registered
    this.registered = null
    if (!token) return

    await this.repository.unregister(token)

    // Also drop the subscription itself, so the next doctor to sign in on this
    // browser is issued a token of their own rather than inheriting one that
    // was just withdrawn.
    try {
      if (this.messaging) {
        const { deleteToken } = await import('firebase/messaging')
        await deleteToken(this.messaging)
      }
    } catch {
      // A token that cannot be deleted locally is already gone from the
      // server, which is the half that matters.
    }
  }

  /**
   * Everything that can be known without loading Firebase.
   *
   * The SDK's own isSupported() checks the same things and a little more, and
   * it is still called before a token is asked for -- but calling it to draw a
   * settings card would mean every signed-in page downloading the library to
   * find out whether it is needed.
   */
  private supportedHere(): boolean {
    return Boolean(env.firebase) &&
      typeof Notification !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      typeof window !== 'undefined' &&
      'PushManager' in window
  }

  private async registerToken(): Promise<void> {
    try {
      const { getToken, isSupported } = await import('firebase/messaging')
      if (!(await isSupported())) return

      const messaging = await this.connect()
      if (!messaging) return

      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL)

      const token = await getToken(messaging, {
        vapidKey: env.firebase!.vapidKey,
        serviceWorkerRegistration: registration,
      })

      if (!token || token === this.registered) return

      const result = await this.repository.register(token)
      if (isOk(result)) this.registered = token
    } catch (error) {
      // Nothing here is worth interrupting the doctor over. The worst outcome
      // is a dashboard that does not notify, which is where it started.
      console.warn('push: could not register this browser', error)
    }
  }

  private async connect(): Promise<Messaging | null> {
    if (!env.firebase) return null

    // Imported here rather than at the top of the file so that the library
    // lands in a chunk of its own, fetched the first time a browser is
    // actually registered instead of on every page the doctor opens.
    const { initializeApp } = await import('firebase/app')
    const { getMessaging } = await import('firebase/messaging')

    this.app ??= initializeApp({
      apiKey: env.firebase.apiKey,
      authDomain: env.firebase.authDomain,
      projectId: env.firebase.projectId,
      messagingSenderId: env.firebase.messagingSenderId,
      appId: env.firebase.appId,
    })
    this.messaging ??= getMessaging(this.app)
    return this.messaging
  }
}
