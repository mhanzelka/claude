# CLAUDE.md

_Last updated: 2026-09-19_

## Coding conventions

- **Split files logically** — prefer many small, focused files over large ones. If a file grows past a few hundred lines or mixes more than one responsibility, split it.
- **Docs and comments in English** — all code comments, JSDoc, and inline documentation must be written in English.
- **Inline comments: the why, not the what** — a comment inside a function earns its place by carrying what the code cannot say: why this way and not the obvious alternative, what breaks if it changes, an outside constraint (a platform bug, an API quirk), where a magic number came from, what was already tried and failed. Skip them for self-explanatory code. **Keep them short** — a line or two, three at the most. If the reason genuinely needs a paragraph, it belongs in the function's JSDoc or a note at the top of the file, not wedged between two statements.
- **Every exported function gets a JSDoc** — and here a plain "what" is wanted, because the reader meets the signature before the body. Three parts, in order:
  1. **What it does**, in one or two sentences. Always present.
  2. **Why**, as a second paragraph — only when there is a non-obvious reason, a trade-off or a constraint worth recording.
  3. **Parameters and the return value** — what each one is and what it is for, including the units or shape when that is not obvious from the type. Say what a caller is expected to do with the result.

  Keep it readable over exhaustive. A one-line helper whose name says everything can have a one-line JSDoc; internal helpers only need one when they are not obvious.

  ```ts
  /**
   * Append a batch of GPS fixes to a tracked trail, oldest first.
   *
   * Points closer together than MIN_GAP_M are dropped: phones emit a fix every couple of seconds
   * even standing still, and storing those turns a coffee break into a thousand rows on one spot.
   *
   * @param trailId the trail the fixes belong to
   * @param points fixes in capture order, each with its own `atMs` — a batch can flush late, so the
   *   arrival time would put minutes of walking on one timestamp
   * @returns how many points were actually stored, after downsampling
   */
  export const appendTrackPoints = async (trailId: string, points: Fix[]): Promise<number> => {
      // A grace-window delete can race these inserts, so an FK violation here is expected, not a bug.
      ...
  }
  ```
- **One statement per line** — don't cram independent statements onto one line (e.g. `a(); b()`). Normal semicolon use within a statement (a `for` header) is fine.
- **Share cross-platform code via `packages/`** — logic used by more than one app (web / mobile / server) that can be sensibly extracted belongs in a shared package, not copied into each app. If it makes sense to separate, separate it.
- **Enforce symmetry for parallel code** — when the same feature exists in two places and genuinely can't be shared (framework APIs, platform SDKs, context vs prop wiring), keep the two implementations structurally symmetric: same shape, names, argument order, and control flow. Any divergence must reflect a real platform constraint, not incidental drift.

## Security & secrets

- **Never commit secrets** — no API keys, tokens, or credentials in code, fixtures, or logs.
- Read secrets from env; keep `.env` out of git and maintain a committed `.env.example`.
- Secrets stay server-side. **Anything shipped in a client bundle is public.** Never echo secret values into logs or terminal output.

## Measuring and changing

Performance work is where confident reasoning goes wrong most often, so these are rules, not advice.

- **Measure the whole operation, not the part you changed.** A query rewritten to compute four times faster can still be slower overall if the write it feeds was never in the measurement. Time the thing the user waits for.
- **Measure on a quiet machine.** Per-call figures taken while a box is saturated carry queueing, not cost. Total time per operation from a loaded run still ranks where the work goes; per-call time from one does not mean what it says.
- **One change at a time.** Two changes in one commit cannot be attributed, and the useless one hides behind the useful one. If two must ship together, measure them apart first.
- **A test you have not seen fail is not a test.** After writing one for a fix, break the fix on purpose and watch the test go red. Especially when the existing suite passed before the change — that often means nothing covers the new path.
- **Check that the fix is the one running.** Copying a file onto a machine is not deploying it; a running service uses the code it was started with.

## Git

- Never add a Claude co-author signature to commits.
- Short, single-line commit messages — no body unless a change genuinely needs explaining.
- Don't write "again" / "back" in changelog or fix copy for something that never worked before.

## Updates

These CLAUDE.md files are maintained at https://github.com/mhanzelka/claude.

When you use this file in a project for the first time, use the `schedule` skill to create a **weekly routine** that checks the repo above for new commits since the last check. If new commits are found, report which files changed and briefly what changed. The schedule should run every Monday.
