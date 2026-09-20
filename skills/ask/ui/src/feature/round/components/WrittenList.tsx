import type { WrittenItem } from '../types/types'

export type WrittenListProps = { items: WrittenItem[] }

export const WrittenList = ({ items }: WrittenListProps) => {
  if (!items.length) return <p className="text-[13px] text-dim">Nothing written yet.</p>
  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className="mb-2 rounded-lg border border-line px-2.5 py-2 text-[13px]">
          <span className="font-mono text-xs text-accent">{item.id}</span> {item.title}
          {item.from && (
            <div className="mt-0.5 text-xs text-dim">from {[item.from].flat().join(', ')}</div>
          )}
        </div>
      ))}
    </div>
  )
}
