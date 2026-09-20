import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { DialogRequest, DialogResult } from '../hooks/useDialog'

export type AskDialogProps = {
  pending: (DialogRequest & { resolve: (result: DialogResult) => void }) | null
  onSettle: (result: DialogResult) => void
}

export const AskDialog = ({ pending, onSettle }: AskDialogProps) => {
  const [text, setText] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (pending) setText(pending.value ?? '')
  }, [pending])

  if (!pending) return null
  const wantsText = pending.input !== false
  const submit = () => onSettle(wantsText ? text : true)

  return (
    <Dialog open onClose={() => onSettle(null)} className="relative z-50">
      <div className="fixed inset-0 bg-black/35" aria-hidden />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="w-full max-w-lg rounded-xl border border-line bg-panel p-4 shadow-2xl"
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            if (!wantsText || event.metaKey || event.ctrlKey) {
              event.preventDefault()
              submit()
            }
          }}
        >
          <DialogTitle className="mb-2.5 font-semibold">{pending.title}</DialogTitle>
          {wantsText && (
            <textarea
              ref={box}
              autoFocus
              rows={pending.rows ?? 3}
              value={text}
              placeholder={pending.placeholder}
              onChange={(event) => setText(event.target.value)}
              className="mb-2.5 w-full resize-y rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-transparent focus:outline-2 focus:outline-accent focus:-outline-offset-1"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={submit}
              className="rounded-md border border-accent bg-accent px-2.5 py-1 text-[13px] font-semibold text-bg"
            >
              {pending.ok ?? 'OK'}
            </button>
            {/* Cancel takes focus on a confirm, so a stray keystroke backs out rather than commits. */}
            <button
              autoFocus={!wantsText}
              onClick={() => onSettle(null)}
              className="rounded-md border border-line bg-panel px-2.5 py-1 text-[13px] hover:border-accent"
            >
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
