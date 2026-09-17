import { z } from 'zod'

/**
 * Validate environment variables at boot. A misconfigured deployment fails
 * fast with a clear message rather than producing obscure runtime errors.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_APP_NAME: z.string().default('Shefaa'),

  // Firebase, for browser notifications. Every one of these is optional: a
  // dashboard with none of them set still runs, and simply never offers
  // notifications. Making them required would mean a project that has not set
  // notifications up cannot start at all, which is a steep price for a feature
  // that is not on the critical path.
  //
  // All of it is public by design -- it ships in the bundle either way, and
  // the VAPID key is the *public* half of the pair. What must stay secret is
  // the service-account key, and that lives only in the Edge Function.
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_VAPID_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `• ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

const firebase = parsed.data.VITE_FIREBASE_API_KEY &&
    parsed.data.VITE_FIREBASE_PROJECT_ID &&
    parsed.data.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    parsed.data.VITE_FIREBASE_APP_ID &&
    parsed.data.VITE_FIREBASE_VAPID_KEY
  ? {
      apiKey: parsed.data.VITE_FIREBASE_API_KEY,
      authDomain: parsed.data.VITE_FIREBASE_AUTH_DOMAIN ?? '',
      projectId: parsed.data.VITE_FIREBASE_PROJECT_ID,
      messagingSenderId: parsed.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: parsed.data.VITE_FIREBASE_APP_ID,
      vapidKey: parsed.data.VITE_FIREBASE_VAPID_KEY,
    }
  : null

export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
  appName: parsed.data.VITE_APP_NAME,
  /** Null when notifications have not been configured for this deployment. */
  firebase,
} as const
