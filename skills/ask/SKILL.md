---
name: ask
description: Ask the human a round of questions in a browser page that stays open across turns — richer than a chat prompt, with per-option consequences, diagrams, a sketch pad, free-text answers, answer-conditional follow-ups, and a live channel for pushing explanations back in. Use it when a decision needs several real choices laid out side by side, or when the built-in question tool is too narrow.
---

# ask

A round of questions the human answers in a local page. The page **stays open across
several of your turns**: they answer what is clear, ask you to explain what is not, and
you push the explanation straight into the open page.

Reach for this instead of the built-in question tool when any of these is true:

- more than four questions, or more than four options on one
- the choice turns on **consequences** — what each option opens, costs, and overturns
- an option is easier shown than described: a schema, a data shape, a diagram
- the answer is **spatial** and the human should draw it
- later questions only make sense depending on an earlier answer
- you expect to have to explain a question before it can be answered

## How it runs

Nothing is installed and nothing runs until you start it. One process holds the page while
the round is open; you kill it when the round is done.

```
ask.py serve <round.json>   long-running: holds the page and the state
ask.py push  <patch.json>   merge a change into the open page, instantly
ask.py wait                 block until the next event, print it, exit
ask.py answers              print everything answered so far
ask.py close                shut the page down
```

All of them take `--session <name>`; use one name per round.

### The loop you actually run

```
1.  write round.json
2.  run `serve` IN THE BACKGROUND          → the page opens in their browser
3.  run `wait` IN THE BACKGROUND           → you are woken when something happens
4.  act on the event, `push` if needed
5.  go back to 3 until the `done` event
6.  `close`
```

`wait` and `serve` both belong in the background: `serve` has to outlive the command that
started it, and a backgrounded `wait` wakes you when the event arrives, so there is no
polling and no timeout to fight.

```bash
# start (background)
python3 <skill>/ask.py --session zones serve round.json

# wait for the next event (background) — returns the events plus all answers so far
python3 <skill>/ask.py --session zones wait --types explain,rejected,done
```

**Filter with `--types`.** Text is saved as it is typed, so an unfiltered `wait` returns on
every few hundred milliseconds of a half-written note. Wake on what you must act on —
`explain`, `rejected`, `done` — and read the answers when you need them; `wait` returns all
of them with every event anyway. Drop the filter only when you are deliberately watching a
particular answer change.

### Events you get back

| event | what it means | what to do |
|---|---|---|
| `answered` / `changed` | one answer was given or edited | nothing, unless it changes a later question |
| `explain` | they do not follow a question; `text` says what is unclear, or is empty for all of it | write the explanation and `push` it into `notes` |
| `rejected` | the option set itself is wrong; `text` is how they would put it | reshape that question and `push` it |
| `done` | the round is handed over | read `answers`, then `close` |

`changed` on a question you have already written up is the one to watch: the page warns
them, but you are the one who has to go back and rewrite it.

## round.json

```jsonc
{
  "title": "Zones — round 2",
  "questions": [
    {
      "id": "shape",                  // stable; answers and pushes key off it
      "header": "zone shape",         // 2–3 words, shown as a chip for navigation
      "text": "Where does a zone's shape come from?",
      "detail": "Longer context. Hideable with ?.",
      "multi": false,                 // true allows several options at once
      "recommend": "both",            // your guess — shown as a guess, never preselected
      "recommend_why": "Deriving it is cleaner, but a plot with no fence would fall out.",
      "note_hint": "anything that qualifies the answer",
      "other_hint": "None of these is it — put it your own way",
      "allow_other": true,            // default; false drops the free-text option
      "options": [
        {
          "id": "both",
          "label": "Both",
          "desc": "One or two sentences.",
          "opens":    "what this makes possible",
          "costs":    "what it complicates",
          "rewrites": "which earlier decisions it overturns",
          "preview":  "monospace block\n  line breaks are significant",
          "svg":      "<svg …>…</svg>",
          "unsure":   "what you are unsure about in this option"
        }
      ]
    }
  ]
}
```

**Fill in `opens`, `costs` and `rewrites` honestly.** They are separate fields precisely so
the cost cannot be buried in prose. If an option has no cost, say so by leaving it out — do
not invent one, and do not hide a real one.

**`recommend` is a guess, not a decision.** Use it where you genuinely have one, with the
reason in `recommend_why`. It is shown set apart and never preselected.

### Questions and options that depend on an answer

```jsonc
"depends_on": "shape"                                       // once that one is answered
"depends_on": { "question": "trigger", "chosen": ["blocks", "changes"] }
"depends_on": { "question": "shape",   "not_chosen": ["derived"] }
```

On a **question** it hides the whole thing; on an **option** it removes just that option.
Use it so answering "no" does not leave behind a page of choices that no longer apply.

If a later change hides an option they had already chosen elsewhere, **the stored answer
stays**. The page does not silently drop it and neither should you — it is a contradiction
worth raising.

## push

A patch merges into the round: questions match by `id`, everything else is replaced, and
anything you leave out is untouched. An answer already given is never disturbed.

```jsonc
{
  "notes":      { "shape": "The difference is whether…" },   // explanation under a question
  "questions":  [ { "id": "shape", "options": [ … ] } ],     // reshape, or add a new question
  "written":    [ { "id": "ADR-144", "title": "…", "from": ["shape"] } ],
  "written_by": { "shape": "ADR-144" }                       // warns them before they change it
}
```

**Keep `written` current.** It is how they see what their answers have already turned into,
and it is what makes changing an earlier answer an informed act rather than a surprise.

## What comes back

```jsonc
{
  "chosen":     ["both"],          // option ids; empty when they wrote their own
  "other":      null,              // their own wording, when they used it
  "note":       "",
  "confidence": "firm",            // or "tentative"
  "unclear":    false,             // true = they asked for an explanation instead
  "sketch":     "<svg …>"          // when they drew something
}
```

**`confidence: "tentative"` is not a decision.** Treat it as provisional and mark it as
such wherever you write it down; ask again before building on it.

**A sketch is an answer.** It comes back as SVG with real coordinates and labels — read it,
do not skim past it.

## Rules

- **Never decide for them.** An unanswered question stays unanswered; do not infer one
  answer from another.
- **`explain` is not a rejection.** It means the question was badly put. Explain it, push
  the explanation, and leave the options alone unless the explanation changes them.
- **`rejected` means your options were wrong.** Reshape the question around what they said
  rather than defending the set you wrote.
- **Never `close` before the `done` event**, unless they say to stop.
- **Twenty questions is the ceiling**, and it is a ceiling, not a target.
