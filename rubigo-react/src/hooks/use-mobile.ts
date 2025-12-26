import * as React from "react"

// =====================================================================
// Breakpoint Constants (matching Tailwind + custom extended breakpoints)
// =====================================================================
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1680,
  "4xl": 2200,
  "5xl": 3200,
  "6xl": 4400,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS | "base"

// =====================================================================
// Breakpoint Detection Hook
// =====================================================================
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("base")

  React.useEffect(() => {
    const getBreakpoint = (): Breakpoint => {
      const width = window.innerWidth
      if (width >= BREAKPOINTS["6xl"]) return "6xl"
      if (width >= BREAKPOINTS["5xl"]) return "5xl"
      if (width >= BREAKPOINTS["4xl"]) return "4xl"
      if (width >= BREAKPOINTS["3xl"]) return "3xl"
      if (width >= BREAKPOINTS["2xl"]) return "2xl"
      if (width >= BREAKPOINTS.xl) return "xl"
      if (width >= BREAKPOINTS.lg) return "lg"
      if (width >= BREAKPOINTS.md) return "md"
      if (width >= BREAKPOINTS.sm) return "sm"
      return "base"
    }

    const handleResize = () => setBreakpoint(getBreakpoint())

    // Set initial value
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return breakpoint
}

// =====================================================================
// Convenience Hooks
// =====================================================================

/**
 * Returns true when viewport is below md breakpoint (< 768px)
 * Use for: hiding sidebar, showing bottom nav
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < BREAKPOINTS.md)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.md)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * Returns true when viewport is md-lg (768px - 1023px)
 * Use for: icon-only sidebar mode
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= BREAKPOINTS.md && width < BREAKPOINTS.lg)
    }
    checkTablet()
    window.addEventListener("resize", checkTablet)
    return () => window.removeEventListener("resize", checkTablet)
  }, [])

  return isTablet
}

/**
 * Returns true when viewport is at or above lg breakpoint (≥ 1024px)
 * Use for: full sidebar expansion
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`)
    const onChange = () => setIsDesktop(window.innerWidth >= BREAKPOINTS.lg)
    mql.addEventListener("change", onChange)
    setIsDesktop(window.innerWidth >= BREAKPOINTS.lg)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isDesktop
}

/**
 * Returns true when viewport matches the given media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}
