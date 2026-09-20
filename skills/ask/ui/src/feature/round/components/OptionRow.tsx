import clsx from 'clsx'
import { Check } from 'lucide-react'
import { Constants } from '../../../constants'
import type { ShownOption } from '../lib/optionsOf'

export type OptionRowProps = {
  option: ShownOption
  index: number
  selected: boolean
  chosen: boolean
  isGuess: boolean
  onPick: () => void
}

export const OptionRow = ({ option, index, selected, chosen, isGuess, onPick }: OptionRowProps) => (
  <button
    data-selected={selected}
    onClick={onPick}
    className={clsx(
      'flex gap-2.5 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-left text-sm',
      'hover:border-accent selected:border-accent selected:bg-accent-soft',
    )}
  >
    <span className="shrink-0 pt-px font-mono text-xs text-dim">
      {Constants.OPTION_KEYS[index] ?? index + 1}
    </span>
    <span className="min-w-0 flex-1">
      <span className={clsx('font-medium', option.other && !chosen && !selected && 'text-dim italic')}>
        {option.label}
      </span>
      {isGuess && <span className="block text-[11px] text-dim">suggestion</span>}
    </span>
    {chosen && <Check size={14} className="mt-0.5 shrink-0 text-ok" aria-label="chosen" />}
  </button>
)
