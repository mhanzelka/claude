import clsx from 'clsx'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import type { Answer, Question } from '../types/types'
import { isAnswered } from '../lib/isAnswered'

export type QuestionPillsProps = {
  questions: Question[]
  visible: Question[]
  answers: Record<string, Answer>
  writtenBy: Record<string, string>
  /** Question ids the assistant is reworking right now. */
  working: string[]
  /** Question ids whose answer a later change has invalidated. */
  stale: string[]
  currentId: string | undefined
  onGo: (index: number) => void
}

type Status = 'done' | 'unclear' | 'locked' | 'open'

const statusOf = (answer: Answer | undefined, isVisible: boolean): Status => {
  if (!isVisible) return 'locked'
  if (answer?.unclear) return 'unclear'
  return isAnswered(answer) ? 'done' : 'open'
}

export const QuestionPills = ({
  questions,
  visible,
  answers,
  writtenBy,
  working,
  stale,
  currentId,
  onGo,
}: QuestionPillsProps) => (
  <nav aria-label="questions" className="mb-2.5 flex flex-wrap gap-1">
    {questions.map((question, index) => {
      const at = visible.indexOf(question)
      const busy = working.includes(question.id)
      const isStale = stale.includes(question.id)
      const status = busy ? 'open' : statusOf(answers[question.id], at >= 0)
      return (
        <button
          key={question.id}
          title={
            busy
              ? 'the assistant is reworking this'
              : isStale
                ? 'an earlier answer changed — this one no longer fits'
                : question.text
          }
          disabled={status === 'locked' && !isStale}
          data-status={status}
          data-current={question.id === currentId}
          onClick={() => at >= 0 && onGo(at)}
          className={clsx(
            'inline-flex h-6 max-w-[190px] items-center gap-1.5 truncate rounded-full border border-line',
            'bg-panel px-2.5 text-xs text-dim',
            writtenBy[question.id] && 'bg-accent-soft',
            isStale && 'border-warn text-warn',
            busy && 'border-accent text-accent',
            'done:border-ok done:text-ok unclear:border-warn unclear:text-warn',
            'locked:cursor-not-allowed locked:opacity-35',
            'current:border-accent current:bg-accent-soft current:font-semibold current:text-ink',
          )}
        >
          {busy ? (
            <LoaderCircle size={11} className="shrink-0 animate-spin text-accent" aria-label="reworking" />
          ) : isStale ? (
            <TriangleAlert size={11} className="shrink-0 text-warn" aria-label="answer no longer fits" />
          ) : (
            <span
              className={clsx(
                'size-1.5 shrink-0 rounded-full bg-current opacity-30',
                (status === 'done' || status === 'unclear') && 'opacity-100',
              )}
            />
          )}
          {question.header ?? index + 1}
          {busy && <span className="text-[10px] text-accent">reworking</span>}
        </button>
      )
    })}
  </nav>
)
