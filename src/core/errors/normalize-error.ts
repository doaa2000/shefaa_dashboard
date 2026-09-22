import type { PostgrestError } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'
import { AppError } from './app-error'
import { t } from '@/app/i18n'

/**
 * A session the server will no longer accept.
 *
 * PostgREST answers PGRST301 when the token it was handed has expired or is
 * otherwise unusable; auth-js raises its own error when the refresh token
 * behind it has been revoked -- by a password change, by an admin reset, or
 * by another tab having already spent it. The two arrive by different routes
 * and mean the same thing to the doctor, so they are recognised together.
 *
 * Matched on the message as well as the code because the same condition
 * reaches us worded rather than numbered, depending on which layer noticed.
 */
const EXPIRED = /jwt expired|jwt is expired|invalid jwt|refresh token|session[ _]not[ _]found|session from session_id claim/i

function isPostgrestError(value: unknown): value is PostgrestError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'details' in value
  )
}

/**
 * Translate any thrown/returned error from Supabase or the network into a
 * typed AppError. This is the single boundary where vendor errors are mapped.
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error

  if (error instanceof AuthError) {
    if (EXPIRED.test(error.message) || EXPIRED.test(error.code ?? '')) {
      return AppError.auth(t('errors.sessionExpired'), error)
    }
    return AppError.auth(error.message, error)
  }

  if (isPostgrestError(error)) {
    // Checked before the codes below, because an expired session is the one
    // failure that is not about the request at all -- every query on the
    // screen fails the same way, and the answer is to sign in again rather
    // than to read what the query said.
    if (error.code === 'PGRST301' || EXPIRED.test(error.message ?? '')) {
      return AppError.auth(t('errors.sessionExpired'), error)
    }

    switch (error.code) {
      // RLS violation / insufficient privilege.
      case '42501':
        return AppError.permission(undefined, error)
      // unique_violation
      case '23505':
        return AppError.conflict(t('errors.duplicate'), error)
      // foreign_key_violation
      case '23503':
        return AppError.conflict(t('errors.relatedMissing'), error)
      // no rows returned by .single()
      case 'PGRST116':
        return AppError.notFound(undefined, error)
      default:
        return AppError.unknown(error.message, error)
    }
  }

  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return AppError.network(undefined, error)
  }

  if (error instanceof Error) {
    return AppError.unknown(error.message, error)
  }

  return AppError.unknown(undefined, error)
}
