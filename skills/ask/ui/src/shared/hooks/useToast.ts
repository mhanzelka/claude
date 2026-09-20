import { useCallback, useRef, useState } from 'react'
import { Constants } from '../../constants'

/** A single transient message; a new one replaces whatever is showing. */
export const useToast = () => {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((text: string, ms: number = Constants.TOAST_MS) => {
    window.clearTimeout(timer.current)
    setMessage(text)
    timer.current = window.setTimeout(() => setMessage(null), ms)
  }, [])

  return { message, show }
}
