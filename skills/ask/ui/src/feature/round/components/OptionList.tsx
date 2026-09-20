import type { Answer, Question } from '../types/types'
import type { ShownOption } from '../lib/optionsOf'
import { OptionRow } from './OptionRow'

export type OptionListProps = {
  question: Question
  options: ShownOption[]
  answer: Answer | undefined
  selected: number
  pending: Set<string>
  onPick: (index: number) => void
}

const isChosen = (option: ShownOption, question: Question, answer: Answer | undefined, pending: Set<string>) => {
  if (option.other) return !!answer?.other
  return question.multi ? pending.has(option.id) : !!answer?.chosen.includes(option.id)
}

export const OptionList = ({ question, options, answer, selected, pending, onPick }: OptionListProps) => (
  <div className="flex flex-col gap-1">
    {options.map((option, index) => (
      <OptionRow
        key={option.id}
        option={option}
        index={index}
        selected={index === selected}
        chosen={isChosen(option, question, answer, pending)}
        isGuess={question.recommend === option.id}
        onPick={() => onPick(index)}
      />
    ))}
  </div>
)
