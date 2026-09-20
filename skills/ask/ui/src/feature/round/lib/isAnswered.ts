import type { Answer } from '../types/types'

/**
 * Whether the human actually said something, as opposed to a record merely existing.
 *
 * Opening the sketch pad or touching a field creates a record; counting those as answers
 * made the progress indicator lie.
 */
export const isAnswered = (answer: Answer | undefined): boolean =>
  !!answer && !!(answer.unclear || answer.chosen.length || answer.other || answer.note.trim() || answer.sketch)
