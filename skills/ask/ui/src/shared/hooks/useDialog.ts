import { useCallback, useState } from 'react'

export type DialogRequest = {
  title: string
  /** false turns it into a plain confirm with no text box. */
  input?: boolean
  value?: string
  placeholder?: string
  ok?: string
  rows?: number
}

export type DialogResult = string | true | null

type Pending = DialogRequest & { resolve: (result: DialogResult) => void }

/**
 * An in-page replacement for window.prompt and window.confirm.
 *
 * Native dialogs block the page and cannot be dismissed by anything driving the browser
 * remotely, which is how this tool is tested — so the project uses none of them.
 */
export const useDialog = () => {
  const [pending, setPending] = useState<Pending | null>(null)

  const request = useCallback(
    (options: DialogRequest) =>
      new Promise<DialogResult>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  const settle = useCallback(
    (result: DialogResult) => {
      pending?.resolve(result)
      setPending(null)
    },
    [pending],
  )

  return { pending, request, settle, isOpen: pending !== null }
}
