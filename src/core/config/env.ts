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

/**
 * A Firebase setting ends up in an HTTP header, and headers are Latin-1 only.
 *
 * Firebase puts the API key in `x-goog-api-key`, so a single invisible
 * character pasted in with a value -- a directional mark copied out of
 * right-to-left text, above all -- fails token registration with "String
 * contains non ISO-8859-1 code point", thrown from inside the SDK, naming
 * neither the setting nor the file it came from. It took a stack trace and
 * several rounds to find once.
 *
 * Reported by name instead, and treated as not configured. Not a thrown error:
 * a doctor should not be locked out of their own appointments because a
 * notification key has a typo in it.
 */
function usable(name: string, value: string | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (/^[\x20-\x7E]*$/.test(trimmed)) return trimmed

  console.error(
    `${name} contains a character that is not plain ASCII, most likely an ` +
      'invisible one pasted in with it. Retype the value by hand in .env. ' +
      'Notifications stay off until it is fixed.',
  )
  return null
}

const firebaseSettings = {
  apiKey: usable('VITE_FIREBASE_API_KEY', parsed.data.VITE_FIREBASE_API_KEY),
  authDomain: usable('VITE_FIREBASE_AUTH_DOMAIN', parsed.data.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: usable('VITE_FIREBASE_PROJECT_ID', parsed.data.VITE_FIREBASE_PROJECT_ID),
  messagingSenderId: usable(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    parsed.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: usable('VITE_FIREBASE_APP_ID', parsed.data.VITE_FIREBASE_APP_ID),
  vapidKey: usable('VITE_FIREBASE_VAPID_KEY', parsed.data.VITE_FIREBASE_VAPID_KEY),
}

// authDomain is the one that may be absent without stopping anything.
const firebase =
  firebaseSettings.apiKey &&
  firebaseSettings.projectId &&
  firebaseSettings.messagingSenderId &&
  firebaseSettings.appId &&
  firebaseSettings.vapidKey
    ? {
        apiKey: firebaseSettings.apiKey,
        authDomain: firebaseSettings.authDomain ?? '',
        projectId: firebaseSettings.projectId,
        messagingSenderId: firebaseSettings.messagingSenderId,
        appId: firebaseSettings.appId,
        vapidKey: firebaseSettings.vapidKey,
      }
    : null

export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
  appName: parsed.data.VITE_APP_NAME,
  /** Null when notifications have not been configured for this deployment. */
  firebase,
} as const
