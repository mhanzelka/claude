import { Constants } from '../../../constants'
import type { Answer, Option, Question } from '../types/types'
import { matchesDependency } from './matchesDependency'

export type ShownOption = Option & { other?: boolean }

/**
 * The option list as the page shows it, with the free-text answer appended as a real option.
 *
 * It belongs in the list rather than in a field below it: "none of the above" is a choice
 * like any other, and keeping it out of the list made it unreachable by keyboard.
 *
 * Options carrying their own dependency drop out here, so answering "no" earlier can remove
 * the choices that no longer make sense without rewriting the question.
 */
export type OptionsOfParams = { question: Question; answers: Record<string, Answer> }

export const optionsOf = ({ question, answers }: OptionsOfParams): ShownOption[] => {
  const options: ShownOption[] = (question.options ?? []).filter((option) =>
    matchesDependency({ dependency: option.depends_on, answers }),
  )
  if (question.allow_other !== false) {
    options.push({
      id: Constants.OTHER_ID,
      label: question.other_label ?? 'Other — my own answer',
      other: true,
    })
  }
  return options
}
