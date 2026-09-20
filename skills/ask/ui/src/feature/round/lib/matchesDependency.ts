import type { Answer, Dependency } from '../types/types'
import { isAnswered } from './isAnswered'

export type MatchesDependencyParams = {
  dependency: Dependency | undefined
  answers: Record<string, Answer>
}

/**
 * Whether a dependency is satisfied by the answers given so far.
 *
 * Nothing to depend on means shown. An unanswered dependency means hidden, so a question
 * never appears before the answer that decides whether it is worth asking.
 */
export const matchesDependency = ({ dependency, answers }: MatchesDependencyParams): boolean => {
  if (!dependency) return true

  const condition = typeof dependency === 'string' ? { question: dependency } : dependency
  const answer = answers[condition.question]
  if (!isAnswered(answer) || !answer) return false

  if (condition.not_chosen?.some((id) => answer.chosen.includes(id))) return false
  if (condition.chosen && !condition.chosen.some((id) => answer.chosen.includes(id))) return false
  return true
}
