import { ref } from 'vue'
import { refDebounced, watchThrottled } from '@vueuse/core'

/**
 * Debounced search term backed by VueUse. The raw input updates immediately;
 * `debounced` settles after the delay and is what callers should watch/query.
 */
export function useDebouncedSearch(delay = 350) {
  const term = ref('')
  const debounced = refDebounced(term, delay)

  function onDebounced(cb: (value: string) => void) {
    watchThrottled(debounced, (value) => cb(value), { throttle: 0 })
  }

  function clear(): void {
    term.value = ''
  }

  return { term, debounced, onDebounced, clear }
}
