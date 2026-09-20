/**
 * The wire contract between ask.py and this page.
 *
 * Field names stay snake_case all the way through: the assistant writes these JSON payloads
 * by hand every round, and a camelCase mapping layer would be one more place for a typo to
 * hide silently.
 */

/**
 * When something is shown, decided by an earlier answer.
 *
 * A bare question id means "once that one is answered at all". With `chosen` or `not_chosen`
 * it narrows to which option was picked, so answering "no" can drop a later question outright
 * or just remove the options that no longer make sense.
 */
export type Condition = {
  question: string
  /** Show only when that answer includes one of these option ids. */
  chosen?: string[]
  /** Hide when that answer includes one of these option ids. */
  not_chosen?: string[]
}

export type Dependency = string | Condition

export type Option = {
  id: string
  label: string
  desc?: string
  /** What this choice makes possible. */
  opens?: string
  /** What it complicates or forecloses. */
  costs?: string
  /** Which earlier decisions it overturns. */
  rewrites?: string
  /** Monospace block — schema, data shape, pseudocode. Line breaks are significant. */
  preview?: string
  /** Inline SVG diagram. */
  svg?: string
  /** What the assistant is unsure about in this option. */
  unsure?: string
  /** Drop this option unless an earlier answer allows it. */
  depends_on?: Dependency
}

export type Question = {
  id: string
  /** Two or three words, used to navigate between questions. */
  header?: string
  text: string
  /** Longer context, hideable. */
  detail?: string
  multi?: boolean
  /** Hidden until an earlier answer allows it. */
  depends_on?: Dependency
  options?: Option[]
  /** Option id the assistant would guess, shown as a guess and never preselected. */
  recommend?: string
  recommend_why?: string
  /** Set false to drop the free-text option. */
  allow_other?: boolean
  other_label?: string
  other_hint?: string
  note_hint?: string
}

export type Certainty = 'firm' | 'tentative'

export type Answer = {
  chosen: string[]
  other: string | null
  note: string
  confidence: Certainty
  /** The human asked for an explanation instead of answering. */
  unclear: boolean
  /** SVG produced by the sketch pad. */
  sketch?: string | null
}

export type WrittenItem = {
  id: string
  title?: string
  /** Question ids this was written from. */
  from?: string | string[]
}

export type Round = {
  title?: string
  questions: Question[]
  /** Explanations the assistant pushed, keyed by question id. */
  notes?: Record<string, string>
  written?: WrittenItem[]
  /** Question id → document its answer is already written into. */
  written_by?: Record<string, string>
}

export type RoundState = {
  round: Round
  answers: Record<string, Answer>
  /** Question ids the assistant is currently reworking. */
  working?: string[]
}

export type EventKind = 'explain' | 'rejected' | 'done'
