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

function push(toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }): string {
  const id = crypto.randomUUID()
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
