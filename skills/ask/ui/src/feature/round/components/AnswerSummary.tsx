import clsx from 'clsx'
import type { Answer, Question } from '../types/types'
import { isAnswered } from '../lib/isAnswered'

export type AnswerSummaryProps = {
  questions: Question[]
  answers: Record<string, Answer>
  onGo: (index: number) => void
}

const describe = (question: Question, answer: Answer): string => {
  if (answer.unclear) return 'asked for an explanation'
  // Looked up in the raw list: an option a later answer has since removed still had a label.
  const labels = answer.chosen.map((id) => question.options?.find((o) => o.id === id)?.label ?? id)
  return answer.other || labels.join(', ') || answer.note || '—'
}

export const AnswerSummary = ({ questions, answers, onGo }: AnswerSummaryProps) => {
  const rows = questions.filter((question) => isAnswered(answers[question.id]))
  if (!rows.length) return <p className="text-[13px] text-dim">Nothing answered yet.</p>

  return (
    <div>
      {rows.map((question) => {
        const answer = answers[question.id]!
        return (
          <button
            key={question.id}
            onClick={() => onGo(questions.indexOf(question))}
            className="block w-full border-b border-line py-1.5 text-left text-[13px] last:border-b-0"
          >
            <span className="font-mono text-[11px] text-dim">{question.header ?? question.id}</span>
            <span className={clsx('block', answer.unclear && 'text-warn')}>{describe(question, answer)}</span>
            {answer.confidence === 'tentative' && <span className="text-[11px] text-dim">tentative</span>}
          </button>
        )
      })}
    </div>
  )
}
