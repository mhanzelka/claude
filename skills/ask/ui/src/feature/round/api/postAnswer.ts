import type { Answer } from '../types/types'

export type PostAnswerParams = { qid: string; answer: Answer }

export const postAnswer = async ({ qid, answer }: PostAnswerParams): Promise<void> => {
  await fetch('/api/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qid, ...answer }),
  })
}
