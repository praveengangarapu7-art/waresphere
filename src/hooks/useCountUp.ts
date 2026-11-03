import { useState, useEffect, useRef } from 'react'

/**
 * Animates a numeric value from 0 (or a nearby start) to the target
 * over `duration` ms using the ease-out curve. Only fires once on mount.
 * If value is not a number (e.g. "96.4%"), it returns the raw string immediately.
 */
export function useCountUp(value: string | number, duration = 700): string | number {
  // Detect if it's a plain numeric value (possibly a float string like "96.4%")
  const rawStr = String(value)
  const hasPercent = rawStr.endsWith('%')
  const numericStr = hasPercent ? rawStr.slice(0, -1) : rawStr
  const parsed = parseFloat(numericStr)
  const isNumeric = !isNaN(parsed)

  const [display, setDisplay] = useState<string | number>(() => {
    if (!isNumeric) return value
    // Start from 0 or from (target - small delta) so it doesn't animate from
    // too far away for large numbers
    return hasPercent ? '0%' : 0
  })
  const hasFired = useRef(false)

  useEffect(() => {
    if (!isNumeric || hasFired.current) return
    hasFired.current = true

    const start = performance.now()
    const startVal = 0
    const endVal = parsed

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // ease-out approximation: t * (2 - t)
      const eased = t * (2 - t)
      const current = startVal + (endVal - startVal) * eased

      // Format: preserve decimal places from original value
      const decimals = (numericStr.split('.')[1] || '').length
      const formatted = current.toFixed(decimals)
      setDisplay(hasPercent ? `${formatted}%` : Number(formatted))

      if (t < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, []) // intentionally only on mount

  if (!isNumeric) return value
  return display
}
