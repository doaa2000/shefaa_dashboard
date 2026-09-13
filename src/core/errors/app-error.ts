/**
 * Domain-agnostic application error hierarchy. Every layer that can fail
 * returns one of these via Result<T, AppError>, so the presentation layer can
 * branch on `kind` without knowing about Supabase/Postgrest internals.
 */
import { t } from '@/app/i18n'

export type AppErrorKind =
  | 'network'
  | 'auth'
  | 'validation'
  | 'not_found'
  | 'permission'
  | 'conflict'
  | 'unknown'

export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly cause?: unknown
  /** Field-level messages for validation errors. */
  readonly fields?: Record<string, string>

  constructor(
    kind: AppErrorKind,
    message: string,
    options?: { cause?: unknown; fields?: Record<string, string> },
  ) {
    super(message)
    this.name = 'AppError'
    this.kind = kind
    this.cause = options?.cause
    this.fields = options?.fields
  }

  // The default messages are read when the error is raised, not when the class
  // is defined: a default evaluated at import time would be written in the
  // language the app started in and stay there.
  static network(message?: string, cause?: unknown) {
    return new AppError('network', message ?? t('errors.network'), { cause })
  }

  static auth(message?: string, cause?: unknown) {
    return new AppError('auth', message ?? t('errors.auth'), { cause })
  }

  static validation(message?: string, fields?: Record<string, string>) {
    return new AppError('validation', message ?? t('errors.validation'), { fields })
  }

  static notFound(message?: string, cause?: unknown) {
    return new AppError('not_found', message ?? t('errors.notFound'), { cause })
  }

  static permission(message?: string, cause?: unknown) {
    return new AppError('permission', message ?? t('errors.permission'), { cause })
  }

  static conflict(message?: string, cause?: unknown) {
    return new AppError('conflict', message ?? t('errors.conflict'), { cause })
  }

  static unknown(message?: string, cause?: unknown) {
    return new AppError('unknown', message ?? t('errors.unknown'), { cause })
  }
}
