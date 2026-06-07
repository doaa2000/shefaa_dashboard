/**
 * Minimal class-name combiner. Accepts strings, arrays, and condition maps,
 * filters falsy values, and joins with a space. Keeps component templates DRY
 * without pulling in an extra dependency.
 */
export type ClassValue = string | number | false | null | undefined | ClassValue[] | Record<string, boolean>

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  for (const input of inputs) {
    if (!input) continue
    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input))
    } else if (Array.isArray(input)) {
      const nested = cn(...input)
      if (nested) out.push(nested)
    } else {
      for (const [key, value] of Object.entries(input)) {
        if (value) out.push(key)
      }
    }
  }
  return out.join(' ')
}
