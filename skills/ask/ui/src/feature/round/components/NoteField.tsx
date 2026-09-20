import { useEffect, useState } from 'react'
import { Constants } from '../../../constants'
import { useDebouncedCallback } from '../../../shared/hooks/useDebouncedCallback'

export type NoteFieldProps = {
  id: string
  value: string
  placeholder: string
  /** Changing this reloads the field; a saved value coming back must not. */
  resetKey: string
  disabled: boolean
  onCommit: (value: string) => void
}

export const NoteField = ({ id, value, placeholder, resetKey, disabled, onCommit }: NoteFieldProps) => {
  const { schedule, flush } = useDebouncedCallback(onCommit, Constants.TEXT_SAVE_DEBOUNCE_MS)
  const [text, setText] = useState(value)

  // Only on a new question. Re-seeding from `value` would fight the caret, because every
  // debounced save comes back through the stream while the field is still being typed in.
  useEffect(() => setText(value), [resetKey])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] tracking-wider text-dim uppercase">
        Note
      </label>
      <textarea
        id={id}
        rows={1}
        value={text}
        placeholder={placeholder}
        onChange={(event) => {
          setText(event.target.value)
          schedule(event.target.value)
        }}
        onBlur={(event) => flush(event.target.value)}
        disabled={disabled}
        className="w-full resize-y rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-transparent focus:outline-2 focus:outline-accent focus:-outline-offset-1 disabled:opacity-50"
      />
    </div>
  )
}
