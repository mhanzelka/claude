import { Kbd } from '../../../shared/components/Kbd'

const HINTS: { keys: string[]; label: string }[] = [
  { keys: ['↑', '↓'], label: 'option' },
  { keys: ['1', '9'], label: 'pick' },
  { keys: ['enter'], label: 'confirm' },
  { keys: ['←', '→'], label: 'question' },
  { keys: ['o'], label: 'other' },
  { keys: ['n'], label: 'note' },
  { keys: ['s'], label: 'sketch' },
  { keys: ['e'], label: 'explain' },
  { keys: ['x'], label: 'rework options' },
  { keys: ['?'], label: 'detail' },
  { keys: ['d'], label: 'done' },
]

export const KeyHints = () => (
  <footer className="mt-2.5 flex flex-wrap gap-2.5 text-[11.5px] text-dim">
    {HINTS.map(({ keys, label }) => (
      <span key={label}>
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}{' '}
        {label}
      </span>
    ))}
  </footer>
)
