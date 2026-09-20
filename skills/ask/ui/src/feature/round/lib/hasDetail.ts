import type { Question } from '../types/types'
import type { ShownOption } from './optionsOf'

export type HasDetailParams = { question: Question; option: ShownOption | undefined }

/**
 * Whether the side pane has anything to show for this option.
 *
 * The free-text option always does — its input lives there — and forgetting that once left
 * the box rendered but hidden, so focusing it silently did nothing.
 */
export const hasDetail = ({ question, option }: HasDetailParams): boolean => {
  if (!option) return false
  if (option.other) return true
  return !!(
    option.desc ||
    option.opens ||
    option.costs ||
    option.rewrites ||
    option.preview ||
    option.svg ||
    option.unsure ||
    (question.recommend === option.id && question.recommend_why)
  )
}
