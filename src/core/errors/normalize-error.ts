import type { PostgrestError } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'
import { AppError } from './app-error'

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
    return AppError.auth(error.message, error)
  }

  if (isPostgrestError(error)) {
    switch (error.code) {
      // RLS violation / insufficient privilege.
      case '42501':
        return AppError.permission(undefined, error)
      // unique_violation
      case '23505':
        return AppError.conflict('A record with these details already exists.', error)
      // foreign_key_violation
      case '23503':
        return AppError.conflict('Related record is missing or in use.', error)
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
