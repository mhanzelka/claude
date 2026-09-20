import clsx from 'clsx'
import type { Answer, Certainty, Question } from '../types/types'
import type { ShownOption } from '../lib/optionsOf'
import { hasDetail } from '../lib/hasDetail'
import { ActionBar } from './ActionBar'
import { ExplainNote } from './ExplainNote'
import { NoteField } from './NoteField'
import { OptionDetail } from './OptionDetail'
import { OptionList } from './OptionList'
import { OtherAnswer } from './OtherAnswer'
import { SketchPad } from '../../../shared/components/SketchPad'
import { StaleWarning } from './StaleWarning'

export type QuestionCardProps = {
  question: Question
  options: ShownOption[]
  answer: Answer | undefined
  selected: number
  pending: Set<string>
  explanation: string | undefined
  writtenIn: string | undefined
  showDetail: boolean
  sketchOpen: boolean
  isLast: boolean
  /** The round is handed over; nothing can be changed until something new is pushed. */
  disabled: boolean
  onPick: (index: number) => void
  onOther: (value: string) => void
  onNote: (value: string) => void
  onCertainty: (value: Certainty) => void
  onSketch: (svg: string) => void
  onAskLabel: () => Promise<string | null>
  onConfirm: () => void
  onExplain: () => void
  onNone: () => void
  onToggleSketch: () => void
  onDone: () => void
}

export const QuestionCard = ({
  question,
  options,
  answer,
  selected,
  pending,
  explanation,
  writtenIn,
  showDetail,
  sketchOpen,
  isLast,
  disabled,
  onPick,
  onOther,
  onNote,
  onCertainty,
  onSketch,
  onAskLabel,
  onConfirm,
  onExplain,
  onNone,
  onToggleSketch,
  onDone,
}: QuestionCardProps) => {
  const option = options[selected]
  const withDetail = hasDetail({ question, option })

  return (
    <section className="rounded-xl border border-line bg-panel px-4 py-3.5">
      <h2 className="mb-1.5 text-lg leading-tight font-semibold">{question.text}</h2>
      {question.detail && showDetail && (
        <p className="mb-2.5 text-sm whitespace-pre-wrap text-dim">{question.detail}</p>
      )}
      {explanation && <ExplainNote text={explanation} />}
      {writtenIn && answer && <StaleWarning documentId={writtenIn} />}

      <div className={clsx('grid items-start gap-4', withDetail && 'md:grid-cols-[minmax(240px,340px)_1fr]')}>
        <OptionList
          question={question}
          options={options}
          answer={answer}
          selected={selected}
          pending={pending}
          disabled={disabled}
          onPick={onPick}
        />
        {withDetail && option && (
          <div className="rounded-lg border border-line bg-bg px-3 py-2.5 text-sm">
            {option.other ? (
              <OtherAnswer
                id="other"
                hint={question.other_hint ?? 'None of the options is it — put it your own way'}
                value={answer?.other ?? ''}
                resetKey={question.id}
                disabled={disabled}
                onCommit={onOther}
              />
            ) : (
              <OptionDetail question={question} option={option} />
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <NoteField
          id="note"
          value={answer?.note ?? ''}
          placeholder={question.note_hint ?? 'anything that qualifies the answer'}
          resetKey={question.id}
          disabled={disabled}
          onCommit={onNote}
        />
        {sketchOpen && <SketchPad scopeKey={question.id} onChange={onSketch} onAskLabel={onAskLabel} />}
        <ActionBar
          certainty={answer?.confidence ?? 'firm'}
          sketchOpen={sketchOpen}
          isLast={isLast}
          disabled={disabled}
          onConfirm={onConfirm}
          onExplain={onExplain}
          onNone={onNone}
          onCertainty={onCertainty}
          onToggleSketch={onToggleSketch}
          onDone={onDone}
        />
      </div>
    </section>
  )
}
