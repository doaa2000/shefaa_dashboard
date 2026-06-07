import { ref, shallowRef, type Ref } from 'vue'
import type { Result } from '@/core/result'
import { isOk } from '@/core/result'
import type { AppError } from '@/core/errors'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseAsyncStateReturn<T, Args extends unknown[]> {
  data: Ref<T | null>
  error: Ref<AppError | null>
  status: Ref<AsyncStatus>
  isLoading: Ref<boolean>
  execute: (...args: Args) => Promise<Result<T, AppError>>
  reset: () => void
}

/**
 * Wraps a Result-returning async function and exposes reactive
 * data / error / loading state. Centralizes the loading-state pattern (DRY).
 */
export function useAsyncState<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<Result<T, AppError>>,
  options: { initialData?: T | null; immediate?: boolean } = {},
): UseAsyncStateReturn<T, Args> {
  const data = shallowRef<T | null>(options.initialData ?? null) as Ref<T | null>
  const error = ref<AppError | null>(null)
  const status = ref<AsyncStatus>('idle')
  const isLoading = ref(false)

  async function execute(...args: Args): Promise<Result<T, AppError>> {
    isLoading.value = true
    status.value = 'loading'
    error.value = null

    const result = await fn(...args)

    if (isOk(result)) {
      data.value = result.value
      status.value = 'success'
    } else {
      error.value = result.error
      status.value = 'error'
    }
    isLoading.value = false
    return result
  }

  function reset(): void {
    data.value = options.initialData ?? null
    error.value = null
    status.value = 'idle'
    isLoading.value = false
  }

  if (options.immediate) {
    void execute(...([] as unknown as Args))
  }

  return { data, error, status, isLoading, execute, reset }
}
