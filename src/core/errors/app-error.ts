/**
 * Domain-agnostic application error hierarchy. Every layer that can fail
 * returns one of these via Result<T, AppError>, so the presentation layer can
 * branch on `kind` without knowing about Supabase/Postgrest internals.
 */
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

  static network(message = 'A network error occurred. Please try again.', cause?: unknown) {
    return new AppError('network', message, { cause })
  }

  static auth(message = 'Authentication failed.', cause?: unknown) {
    return new AppError('auth', message, { cause })
  }

  static validation(message = 'Validation failed.', fields?: Record<string, string>) {
    return new AppError('validation', message, { fields })
  }

  static notFound(message = 'The requested resource was not found.', cause?: unknown) {
    return new AppError('not_found', message, { cause })
  }

  static permission(message = 'You do not have permission to perform this action.', cause?: unknown) {
    return new AppError('permission', message, { cause })
  }

  static conflict(message = 'This action conflicts with existing data.', cause?: unknown) {
    return new AppError('conflict', message, { cause })
  }

  static unknown(message = 'Something went wrong. Please try again.', cause?: unknown) {
    return new AppError('unknown', message, { cause })
  }
}
