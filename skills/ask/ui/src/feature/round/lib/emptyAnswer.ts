import type { Answer } from '../types/types'

export const emptyAnswer = (): Answer => ({
  chosen: [],
  other: null,
  note: '',
  confidence: 'firm',
  unclear: false,
})
