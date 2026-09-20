import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postAnswer, type PostAnswerParams } from '../api/postAnswer'
import type { RoundState } from '../types/types'
import { stateQueryKey } from './useStateQuery'

/**
 * Save one answer.
 *
 * The cache is updated before the request so the page never waits on a round trip; the
 * stream then confirms it. An answer identical to the stored one is dropped by the server,
 * so a repeated save cannot show up as a change the assistant gets woken for.
 */
export const useAnswerMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postAnswer,
    onMutate: ({ qid, answer }: PostAnswerParams) => {
      queryClient.setQueryData<RoundState>(stateQueryKey, (previous) =>
        previous ? { ...previous, answers: { ...previous.answers, [qid]: answer } } : previous,
      )
    },
  })
}
