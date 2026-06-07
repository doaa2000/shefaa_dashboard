import { computed, ref } from 'vue'

export interface PaginationRange {
  from: number
  to: number
}

export function usePagination(options: { pageSize?: number; total?: number } = {}) {
  const page = ref(1)
  const pageSize = ref(options.pageSize ?? 10)
  const total = ref(options.total ?? 0)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  /** Supabase `.range()` bounds for the current page (0-indexed, inclusive). */
  const range = computed<PaginationRange>(() => {
    const from = (page.value - 1) * pageSize.value
    return { from, to: from + pageSize.value - 1 }
  })

  function next(): void {
    if (hasNext.value) page.value += 1
  }
  function prev(): void {
    if (hasPrev.value) page.value -= 1
  }
  function goTo(target: number): void {
    page.value = Math.min(Math.max(1, target), totalPages.value)
  }
  function setTotal(value: number): void {
    total.value = value
  }
  function reset(): void {
    page.value = 1
  }

  return { page, pageSize, total, totalPages, hasPrev, hasNext, range, next, prev, goTo, setTotal, reset }
}
