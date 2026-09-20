import type { Answer, Question } from '../types/types'
import { isAnswered } from './isAnswered'
import { optionsOf } from './optionsOf'
import { visibleQuestions } from './visibleQuestions'

export type StaleReason = 'hidden' | 'option-gone'

export type StaleAnswer = { question: Question; reason: StaleReason }

export type StaleAnswersParams = {
  questions: Question[]
  answers: Record<string, Answer>
}

/**
 * Answers a later change has invalidated.
 *
 * Dependencies are re-evaluated from the answers on every render, so changing an early
 * answer can hide a question that was already answered, or remove an option that was already
 * chosen. Nothing is deleted — the contradiction is the human's to resolve — but it has to
 * be visible, or an answer quietly stops meaning what it says.
 */
export const staleAnswers = ({ questions, answers }: StaleAnswersParams): StaleAnswer[] => {
  const visible = new Set(visibleQuestions({ questions, answers }).map((question) => question.id))

  return questions.flatMap<StaleAnswer>((question) => {
    const answer = answers[question.id]
    if (!isAnswered(answer) || !answer) return []
    if (!visible.has(question.id)) return [{ question, reason: 'hidden' }]

    const available = new Set(optionsOf({ question, answers }).map((option) => option.id))
    const gone = answer.chosen.some((id) => !available.has(id))
    return gone ? [{ question, reason: 'option-gone' }] : []
  })
}
