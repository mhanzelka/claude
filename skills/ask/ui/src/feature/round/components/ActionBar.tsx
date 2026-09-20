import clsx from 'clsx'
import { CircleHelp, Flag, Pencil, RefreshCw } from 'lucide-react'
import { Kbd } from '../../../shared/components/Kbd'
import type { Certainty } from '../types/types'

export type ActionBarProps = {
  certainty: Certainty
  sketchOpen: boolean
  onConfirm: () => void
  onExplain: () => void
  onNone: () => void
  onCertainty: (value: Certainty) => void
  onToggleSketch: () => void
  onDone: () => void
}

export const ActionBar = ({
  certainty,
  sketchOpen,
  onConfirm,
  onExplain,
  onNone,
  onCertainty,
  onToggleSketch,
  onDone,
}: ActionBarProps) => {
  const plain = 'rounded-md border border-line bg-panel px-2.5 py-1 text-[13px] hover:border-accent'
  const toggle = clsx(plain, 'selected:border-accent selected:bg-accent-soft')

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onConfirm}
        className="rounded-md border border-accent bg-accent px-2.5 py-1 text-[13px] font-semibold text-bg"
      >
        Confirm
        <Kbd>enter</Kbd>
      </button>
      <button onClick={onExplain} className={clsx(plain, 'flex items-center gap-1.5')}>
        <CircleHelp size={13} aria-hidden />
        explain
        <Kbd>e</Kbd>
      </button>
      <button onClick={onNone} className={clsx(plain, 'flex items-center gap-1.5 text-warn')}>
        <RefreshCw size={13} aria-hidden />
        rework the options
        <Kbd>x</Kbd>
      </button>

      <span className="mx-1 self-stretch border-l border-line" />

      <button data-selected={certainty === 'firm'} onClick={() => onCertainty('firm')} className={toggle}>
        firm
      </button>
      <button data-selected={certainty === 'tentative'} onClick={() => onCertainty('tentative')} className={toggle}>
        tentative
      </button>
      <button
        data-selected={sketchOpen}
        onClick={onToggleSketch}
        className={clsx(toggle, 'flex items-center gap-1.5')}
      >
        <Pencil size={13} aria-hidden />
        sketch
        <Kbd>s</Kbd>
      </button>

      <span className="flex-1" />

      <button onClick={onDone} className={clsx(plain, 'flex items-center gap-1.5')}>
        <Flag size={13} aria-hidden />
        done
        <Kbd>d</Kbd>
      </button>
    </div>
  )
}
