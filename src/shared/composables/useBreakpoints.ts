import { useBreakpoints as useVueUseBreakpoints } from '@vueuse/core'

const tailwindBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useBreakpoints() {
  const bp = useVueUseBreakpoints(tailwindBreakpoints)
  return {
    isMobile: bp.smaller('lg'),
    isDesktop: bp.greaterOrEqual('lg'),
    breakpoints: bp,
  }
}
