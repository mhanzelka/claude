import { useMutation } from '@tanstack/react-query'
import { postEvent } from '../api/postEvent'

export const useEventMutation = () => useMutation({ mutationFn: postEvent })
