import type { Answer, Question } from '../types/types'
import { matchesDependency } from './matchesDependency'

export type VisibleQuestionsParams = {
  questions: Question[]
  answers: Record<string, Answer>
}

/** Questions whose dependency is satisfied; the rest cannot be asked yet. */
export const visibleQuestions = ({ questions, answers }: VisibleQuestionsParams): Question[] =>
  questions.filter((question) => matchesDependency({ dependency: question.depends_on, answers }))
