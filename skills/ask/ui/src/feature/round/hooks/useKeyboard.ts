import { useEffect, useRef } from 'react'
import { Constants } from '../../../constants'

export type UseKeyboardParams = {
  /** False while a dialog owns the keyboard. */
  enabled: boolean
  optionCount: number
  multi: boolean
  onMove: (delta: number) => void
  onPickIndex: (index: number) => void
  onConfirm: () => void
  onStep: (delta: number) => void
  onToggleSelected: () => void
  onFocus: (id: string) => void
  onToggleSketch: () => void
  onExplain: () => void
  onNone: () => void
  onToggleDetail: () => void
  onDone: () => void
}

/**
 * Whole-keyboard operation, because a round is walked through for a long time.
 *
 * Options sit on digits and commands on letters: they shared an alphabet once, and typing
 * into an unfocused page then picked options, jumped between fields and handed the round in.
 */
export const useKeyboard = (params: UseKeyboardParams) => {
  // Held in a ref so the listener is bound once; the params object is new on every render.
  const latest = useRef(params)
  latest.current = params

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const params = latest.current
      if (!params.enabled) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (event.key === 'Escape') (document.activeElement as HTMLElement).blur()
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const key = event.key
      const digit = Constants.OPTION_KEYS.indexOf(key)

      if (key === 'ArrowDown') params.onMove(1)
      else if (key === 'ArrowUp') params.onMove(-1)
      else if (key === 'ArrowRight') params.onStep(1)
      else if (key === 'ArrowLeft') params.onStep(-1)
      else if (key === 'Enter') params.onConfirm()
      else if (key === ' ' && params.multi) params.onToggleSelected()
      else if (key === 'o') params.onFocus('other')
      else if (key === 'n') params.onFocus('note')
      else if (key === 's') params.onToggleSketch()
      else if (key === 'e') params.onExplain()
      else if (key === 'x') params.onNone()
      else if (key === '?') params.onToggleDetail()
      else if (key === 'd') params.onDone()
      else if (digit >= 0 && digit < params.optionCount) params.onPickIndex(digit)
      else return

      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
