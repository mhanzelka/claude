import { useCallback, useEffect, useMemo, useState } from 'react'
import { LoaderCircle, PanelRight } from 'lucide-react'
import { Constants } from '../../../constants'
import { AskDialog } from '../../../shared/components/AskDialog'
import { Toast } from '../../../shared/components/Toast'
import { useDialog } from '../../../shared/hooks/useDialog'
import { useToast } from '../../../shared/hooks/useToast'
import { useAnswerMutation } from '../hooks/useAnswerMutation'
import { useEventMutation } from '../hooks/useEventMutation'
import { useKeyboard } from '../hooks/useKeyboard'
import { useStateQuery } from '../hooks/useStateQuery'
import { useStateStream } from '../hooks/useStateStream'
import { emptyAnswer } from '../lib/emptyAnswer'
import { isAnswered } from '../lib/isAnswered'
import { optionsOf } from '../lib/optionsOf'
import { staleAnswers } from '../lib/staleAnswers'
import { visibleQuestions } from '../lib/visibleQuestions'
import type { Answer, Certainty } from '../types/types'
import { KeyHints } from './KeyHints'
import { QuestionCard } from './QuestionCard'
import { QuestionPills } from './QuestionPills'
import { SidePanel } from './SidePanel'

export const RoundPage = () => {
  const { data } = useStateQuery()
  const answerMutation = useAnswerMutation()
  const eventMutation = useEventMutation()
  const dialog = useDialog()
  const toast = useToast()

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(0)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [showDetail, setShowDetail] = useState(true)
  const [sketchOpen, setSketchOpen] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)

  const onDisconnect = useCallback(() => toast.show('connection lost — the page was closed on the other side'), [toast])
  useStateStream({ onDisconnect })

  const round = data?.round
  const answers = useMemo(() => data?.answers ?? {}, [data])
  const submitted = !!data?.submitted

  // Where the cursor sits counts as an answer for the purpose of dependencies, so a later
  // question appears or disappears the moment an option is highlighted — without anything
  // being sent, because highlighting is not answering.
  const [draft, setDraft] = useState<Record<string, string[]>>({})
  const effective = useMemo(() => {
    const merged: Record<string, Answer> = { ...answers }
    for (const [qid, chosen] of Object.entries(draft)) {
      merged[qid] = { ...emptyAnswer(), ...answers[qid], chosen }
    }
    return merged
  }, [answers, draft])

  const visible = useMemo(
    () => visibleQuestions({ questions: round?.questions ?? [], answers: effective }),
    [round, effective],
  )
  // Recomputed from the answers on every change, so an early answer that invalidates a later
  // one is caught the moment it happens rather than at the end of the round.
  const stale = useMemo(
    () => staleAnswers({ questions: round?.questions ?? [], answers: effective }).map((item) => item.question.id),
    [round, effective],
  )
  const working = data?.working ?? []
  const question = visible[Math.min(current, Math.max(0, visible.length - 1))]
  const answer = question ? answers[question.id] : undefined
  const options = useMemo(
    () => (question ? optionsOf({ question, answers: effective }) : []),
    [question, effective],
  )

  // A fresh question starts on whatever was chosen last time, not on the first row.
  useEffect(() => {
    if (!question) return
    const stored = answers[question.id]
    const index = stored?.other
      ? options.findIndex((option) => option.other)
      : options.findIndex((option) => option.id === stored?.chosen[0])
    setSelected(index >= 0 ? index : 0)
    setPending(new Set(stored?.chosen ?? []))
    // Only when the question itself changes: re-running on every answer would fight the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id])

  const save = useCallback(
    (patch: Partial<Answer>) => {
      if (!question) return
      const next: Answer = { ...emptyAnswer(), ...answers[question.id], ...patch }
      answerMutation.mutate({ qid: question.id, answer: next })
    },
    [question, answers, answerMutation],
  )

  const goTo = (index: number) => {
    setCurrent(Math.max(0, Math.min(index, visible.length - 1)))
    setSketchOpen(false)
  }

  // Selecting is not answering: it moves the cursor and nothing leaves the page. Only
  // Confirm sends, so a cursor passing over an option never reaches the assistant.
  const pick = (index: number) => {
    if (submitted || !question) return
    setSelected(index)
    const option = options[index]
    if (!option) return
    if (option.other) {
      setDraft((current) => ({ ...current, [question.id]: [] }))
      return
    }
    if (question.multi) {
      const next = new Set(pending)
      next.has(option.id) ? next.delete(option.id) : next.add(option.id)
      setPending(next)
      setDraft((current) => ({ ...current, [question.id]: [...next] }))
      return
    }
    setDraft((current) => ({ ...current, [question.id]: [option.id] }))
  }

  const isLast = visible.length > 0 && current === visible.length - 1

  const confirm = () => {
    if (!question || submitted) return
    const option = options[selected]
    const chosen = option?.other ? [] : question.multi ? [...pending] : option ? [option.id] : []
    const stored = answers[question.id]
    if (!chosen.length && !stored?.other && !stored?.note.trim()) {
      toast.show('pick one, or write your own answer')
      return
    }
    save({ chosen, other: option?.other ? stored?.other ?? null : null, unclear: false })
    setDraft(({ [question.id]: _dropped, ...rest }) => rest)
    if (isLast) {
      void done()
      return
    }
    const next = visible.findIndex((item, index) => index > current && !isAnswered(answers[item.id]))
    goTo(next >= 0 ? next : current + 1)
  }

  const explain = async () => {
    if (!question) return
    const what = await dialog.request({ title: 'What is unclear? Leave it empty for the whole question.', ok: 'Ask' })
    if (what === null) return
    save({ unclear: true })
    eventMutation.mutate({ type: 'explain', qid: question.id, text: String(what) })
    toast.show('asked — the assistant will explain')
  }

  const none = async () => {
    if (!question) return
    const text = await dialog.request({
      title: 'None of these fits. How would you put it?',
      value: answer?.other ?? '',
      ok: 'Send',
    })
    if (!text || text === true) return
    save({ chosen: [], other: text, unclear: false })
    eventMutation.mutate({ type: 'rejected', qid: question.id, text })
    toast.show('sent — the round will be reshaped')
  }

  const done = async () => {
    const left = visible.filter((item) => !isAnswered(answers[item.id])).length
    const okay = await dialog.request({
      title: left
        ? `${left} question(s) still unanswered. Hand the round over anyway?`
        : 'Hand the round over?',
      input: false,
      ok: 'Hand it over',
    })
    if (!okay) return
    eventMutation.mutate({ type: 'done' })
    toast.show('done — handing it over', Constants.TOAST_LONG_MS)
  }

  useKeyboard({
    enabled: !dialog.isOpen && !submitted,
    optionCount: options.length,
    multi: !!question?.multi,
    onMove: (delta) => setSelected((value) => (options.length ? (value + delta + options.length) % options.length : 0)),
    onPickIndex: pick,
    onConfirm: confirm,
    onStep: (delta) => goTo(current + delta),
    onToggleSelected: () => pick(selected),
    onFocus: (id) => document.getElementById(id)?.focus(),
    onToggleSketch: () => setSketchOpen((value) => !value),
    onExplain: () => void explain(),
    onNone: () => void none(),
    onToggleDetail: () => setShowDetail((value) => !value),
    onDone: () => void done(),
  })

  const answered = visible.filter((item) => isAnswered(answers[item.id])).length

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-bg px-3.5 py-2">
        <h1 className="text-[15px] font-semibold">{round?.title ?? 'ask'}</h1>
        <div className="flex items-center gap-3">
          <span className="text-[13px] tabular-nums text-dim">
            {visible.length ? `${answered}/${visible.length}` : ''}
          </span>
          <button
            onClick={() => setSideOpen((value) => !value)}
            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[13px] text-dim hover:border-accent"
          >
            <PanelRight size={13} aria-hidden />
            written
          </button>
        </div>
      </header>

      <div className="flex items-start">
        <main className="mx-auto min-w-0 max-w-[1180px] flex-1 px-3.5 py-3">
          <QuestionPills
            questions={round?.questions ?? []}
            visible={visible}
            answers={answers}
            writtenBy={round?.written_by ?? {}}
            working={working}
            stale={stale}
            currentId={question?.id}
            onGo={goTo}
          />
          {submitted && (
            <p className="mb-2.5 flex items-center gap-2 rounded-lg border border-accent bg-accent-soft px-3 py-2 text-[13px]">
              <LoaderCircle size={13} className="shrink-0 animate-spin text-accent" aria-hidden />
              Handed over. Anything new appears right here — leave this window open.
            </p>
          )}
          {question ? (
            <QuestionCard
              question={question}
              options={options}
              answer={answer}
              selected={selected}
              pending={pending}
              explanation={round?.notes?.[question.id]}
              writtenIn={round?.written_by?.[question.id]}
              showDetail={showDetail}
              sketchOpen={sketchOpen}
              isLast={isLast}
              disabled={submitted}
              onPick={pick}
              onOther={(value) => save({ other: value || null, chosen: [] })}
              onNote={(value) => save({ note: value })}
              onCertainty={(value: Certainty) => save({ confidence: value })}
              onSketch={(svg) => save({ sketch: svg || null })}
              onAskLabel={async () => {
                const text = await dialog.request({ title: 'Label', rows: 1, ok: 'Add' })
                return typeof text === 'string' ? text : null
              }}
              onConfirm={confirm}
              onExplain={() => void explain()}
              onNone={() => void none()}
              onToggleSketch={() => setSketchOpen((value) => !value)}
              onDone={() => void done()}
            />
          ) : (
            <p className="text-dim">Waiting for a round…</p>
          )}
          <KeyHints />
        </main>
        {sideOpen && (
          <SidePanel
            written={round?.written ?? []}
            questions={visible}
            answers={answers}
            onGo={goTo}
          />
        )}
      </div>

      <AskDialog pending={dialog.pending} onSettle={dialog.settle} />
      <Toast message={toast.message} />
    </>
  )
}
