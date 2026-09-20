import type { RoundState } from '../types/types'

export const getState = async (): Promise<RoundState> =>
  fetch('/api/state').then((r) => r.json())
