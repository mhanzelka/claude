import { useEffect, useState } from 'react'
import { Constants } from '../../../constants'
import { useDebouncedCallback } from '../../../shared/hooks/useDebouncedCallback'

export type OtherAnswerProps = {
  id: string
  hint: string
  value: string
  /** Changing this reloads the field; a saved value coming back must not. */
  resetKey: string
  onCommit: (value: string) => void
}

export const OtherAnswer = ({ id, hint, value, resetKey, onCommit }: OtherAnswerProps) => {
  const { schedule, flush } = useDebouncedCallback(onCommit, Constants.TEXT_SAVE_DEBOUNCE_MS)
  const [text, setText] = useState(value)

  useEffect(() => setText(value), [resetKey])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <label htmlFor={id} className="mb-1 block text-[11px] tracking-wider text-dim uppercase">
        {hint}
      </label>
      <textarea
        id={id}
        autoFocus
        rows={4}
        value={text}
        placeholder="your own answer"
        onChange={(event) => {
          setText(event.target.value)
          schedule(event.target.value)
        }}
        onBlur={(event) => flush(event.target.value)}
        className="w-full resize-y rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-transparent focus:outline-2 focus:outline-accent focus:-outline-offset-1"
      />
    </>
  )
}
