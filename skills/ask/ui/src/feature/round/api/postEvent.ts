import type { EventKind } from '../types/types'

export type PostEventParams = { type: EventKind; qid?: string; text?: string | null }

export const postEvent = async (params: PostEventParams): Promise<void> => {
  await fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
}
