import type { Answer, Question, WrittenItem } from '../types/types'
import { AnswerSummary } from './AnswerSummary'
import { WrittenList } from './WrittenList'

export type SidePanelProps = {
  written: WrittenItem[]
  questions: Question[]
  answers: Record<string, Answer>
  onGo: (index: number) => void
}

export const SidePanel = ({ written, questions, answers, onGo }: SidePanelProps) => (
  <aside className="sticky top-[45px] hidden max-h-[calc(100vh-45px)] w-80 shrink-0 overflow-auto border-l border-line p-4 lg:block">
    <h2 className="mb-2 text-xs tracking-widest text-dim uppercase">Written so far</h2>
    <WrittenList items={written} />
    <h2 className="mt-4 mb-2 text-xs tracking-widest text-dim uppercase">Answers</h2>
    <AnswerSummary questions={questions} answers={answers} onGo={onGo} />
  </aside>
)
