import clsx from 'clsx'
import type { Question } from '../types/types'
import type { ShownOption } from '../lib/optionsOf'

export type OptionDetailProps = { question: Question; option: ShownOption }

type FacetProps = { label: string; value: string | undefined; tone?: 'opens' | 'costs' }

const Facet = ({ label, value, tone }: FacetProps) => {
  if (!value) return null
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2.5 text-[13.5px]">
      <dt className="pt-0.5 text-xs tracking-wider text-dim uppercase">{label}</dt>
      <dd className={clsx(tone === 'opens' && 'text-ok', tone === 'costs' && 'text-warn')}>{value}</dd>
    </div>
  )
}

export const OptionDetail = ({ question, option }: OptionDetailProps) => (
  <>
    {option.desc && <p className="mb-2.5">{option.desc}</p>}
    <dl className="mb-2.5 flex flex-col gap-1.5">
      <Facet label="opens" value={option.opens} tone="opens" />
      <Facet label="costs" value={option.costs} tone="costs" />
      <Facet label="rewrites" value={option.rewrites} />
    </dl>
    {option.preview && (
      <pre className="mb-2.5 overflow-auto rounded-md border border-line bg-panel px-2.5 py-2 font-mono text-xs leading-relaxed whitespace-pre">
        {option.preview}
      </pre>
    )}
    {/* The diagram comes from the assistant's own payload, never from anything the page fetched. */}
    {option.svg && (
      <div
        className="mb-2.5 overflow-auto rounded-md border border-line bg-panel p-2 [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: option.svg }}
      />
    )}
    {question.recommend === option.id && question.recommend_why && (
      <p className="mb-1.5 border-t border-dashed border-line pt-2 text-[12.5px] text-dim">
        <b className="font-semibold text-ink">why I'd guess this:</b> {question.recommend_why}
      </p>
    )}
    {option.unsure && (
      <p className="mb-1.5 border-t border-dashed border-line pt-2 text-[12.5px] text-dim">
        <b className="font-semibold text-ink">what I'm unsure about:</b> {option.unsure}
      </p>
    )}
  </>
)
