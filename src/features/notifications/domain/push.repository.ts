import type { Result } from '@/core/result'
import type { AppError } from '@/core/errors'

/**
 * Where this browser's push subscription is remembered.
 *
 * A token identifies a browser profile on a machine, not a person, so the
 * database keys on the token and moves it between accounts as they sign in and
 * out. Nothing here has to know that; it only hands the token over and takes
 * it back.
 */
export interface IPushRepository {
  register(token: string): Promise<Result<void, AppError>>
  unregister(token: string): Promise<Result<void, AppError>>
}
