import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { RoundState } from '../types/types'
import { stateQueryKey } from './useStateQuery'

export type UseStateStreamParams = { onDisconnect: () => void }

/**
 * Feed the server's event stream straight into the query cache.
 *
 * The assistant pushes changes into an open page — an explanation, a new question, what it
 * has written so far — so the page has one source of truth and never polls.
 */
export const useStateStream = ({ onDisconnect }: UseStateStreamParams) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const source = new EventSource('/api/stream')
    source.onmessage = (message) => {
      queryClient.setQueryData<RoundState>(stateQueryKey, JSON.parse(message.data))
    }
    source.onerror = onDisconnect
    return () => source.close()
  }, [queryClient, onDisconnect])
}
