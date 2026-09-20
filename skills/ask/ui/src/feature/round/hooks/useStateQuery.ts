import { useQuery } from '@tanstack/react-query'
import { getState } from '../api/getState'

export const stateQueryKey = ['state'] as const

export const useStateQuery = () =>
  useQuery({
    queryKey: stateQueryKey,
    queryFn: getState,
    // The stream keeps this fresh; polling on top of it would only fight the cache.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
