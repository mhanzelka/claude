import clsx from 'clsx'
import { CircleHelp, Flag, Pencil, RefreshCw } from 'lucide-react'
import { Kbd } from '../../../shared/components/Kbd'
import type { Certainty } from '../types/types'

export type ActionBarProps = {
  certainty: Certainty
  sketchOpen: boolean
  /** On the last question the primary action hands the whole round over. */
  isLast: boolean
  disabled: boolean
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
  isLast,
  disabled,
  onConfirm,
  onExplain,
  onNone,
  onCertainty,
  onToggleSketch,
  onDone,
}: ActionBarProps) => {
  const plain = clsx(
    'rounded-md border border-line bg-panel px-2.5 py-1 text-[13px] hover:border-accent',
    'disabled:opacity-40 disabled:hover:border-line',
  )
  const toggle = clsx(plain, 'selected:border-accent selected:bg-accent-soft')

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="rounded-md border border-accent bg-accent px-2.5 py-1 text-[13px] font-semibold text-bg disabled:opacity-40"
      >
        {isLast ? 'Submit' : 'Confirm'}
        <Kbd>enter</Kbd>
      </button>
      <button onClick={onDone} disabled={disabled} className={clsx(plain, 'flex items-center gap-1.5')}>
        <Flag size={13} aria-hidden />
        done
        <Kbd>d</Kbd>
      </button>

      <span className="mx-1 self-stretch border-l border-line" />

      <button onClick={onExplain} disabled={disabled} className={clsx(plain, 'flex items-center gap-1.5')}>
        <CircleHelp size={13} aria-hidden />
        explain
        <Kbd>e</Kbd>
      </button>
      <button onClick={onNone} disabled={disabled} className={clsx(plain, 'flex items-center gap-1.5 text-warn')}>
        <RefreshCw size={13} aria-hidden />
        rework the options
        <Kbd>x</Kbd>
      </button>

      <span className="flex-1" />

      <button
        data-selected={certainty === 'firm'}
        disabled={disabled}
        onClick={() => onCertainty('firm')}
        className={toggle}
      >
        firm
      </button>
      <button
        data-selected={certainty === 'tentative'}
        disabled={disabled}
        onClick={() => onCertainty('tentative')}
        className={toggle}
      >
        tentative
      </button>
      <button
        data-selected={sketchOpen}
        disabled={disabled}
        onClick={onToggleSketch}
        className={clsx(toggle, 'flex items-center gap-1.5')}
      >
        <Pencil size={13} aria-hidden />
        sketch
        <Kbd>s</Kbd>
      </button>
    </div>
  )
}
