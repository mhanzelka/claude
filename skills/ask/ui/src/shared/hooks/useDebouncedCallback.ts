import { useCallback, useEffect, useRef } from 'react'

/**
 * Call `fn` after the user stops typing, with a way to flush it immediately.
 *
 * Text is saved as it is typed rather than on blur: the page stays open for hours and may be
 * closed mid-sentence, and an answer that only exists in the DOM is an answer that is lost.
 */
export const useDebouncedCallback = <T>(fn: (value: T) => void, ms: number) => {
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(fn)
  latest.current = fn

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const schedule = useCallback(
    (value: T) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => latest.current(value), ms)
    },
    [ms],
  )

  const flush = useCallback((value: T) => {
    window.clearTimeout(timer.current)
    latest.current(value)
  }, [])

  return { schedule, flush }
}
