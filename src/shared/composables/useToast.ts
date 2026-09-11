import { readonly, ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration: number
}

// Module-level singleton store so any component can push toasts.
const toasts = ref<Toast[]>([])

function dismiss(id: string): void {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

let counter = 0

/**
 * A toast id only has to be unique among the handful on screen.
 *
 * crypto.randomUUID exists only in a secure context, so it is undefined over
 * plain HTTP on a LAN address — which is exactly how the dev server is reached
 * when `host: true` lets another device open it. Calling it there threw while
 * rendering an error toast, hiding the error the toast was there to report.
 */
function nextId(): string {
  counter += 1
  return `toast-${Date.now().toString(36)}-${counter}`
}

function push(toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }): string {
  const id = nextId()
  const duration = toast.duration ?? 4000
  toasts.value = [...toasts.value, { ...toast, id, duration }]
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
  return id
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    dismiss,
    success: (title: string, description?: string) => push({ variant: 'success', title, description }),
    error: (title: string, description?: string) => push({ variant: 'error', title, description }),
    info: (title: string, description?: string) => push({ variant: 'info', title, description }),
    warning: (title: string, description?: string) => push({ variant: 'warning', title, description }),
  }
}
