# ask

A round of questions answered in a local browser page. `SKILL.md` is the usage contract —
what Claude reads when it uses the tool. This file is for changing it.

## Layout

```
SKILL.md      the usage contract; loaded into context on every invocation, so keep it lean
ask.py        the whole runtime — standard library only, no dependencies
example/      a round.json worth reading before writing one
web/          the built page ask.py serves; committed, so using the tool needs no node
ui/           React + TypeScript source and its toolchain; only needed to change the page
```

`web/` is committed on purpose. The tool exists to be reachable on any machine with Python,
and "run npm install first" would defeat that at exactly the moment it is wanted.

## Changing the page

Conventions follow [`CLAUDE-frontend.md`](../../CLAUDE-frontend.md) in this repo.

```bash
cd ui
npm install
npm run dev      # vite dev server, against a separately running `ask.py serve`
npm run build    # rebuilds ../web
```

**Commit `web/` in the same change as the source**, or the tool keeps shipping the old page.

The build writes fixed filenames rather than content hashes: the page is served with
`Cache-Control: no-store`, so a hash buys nothing and would add two files to git history on
every rebuild.

## Design notes

Three constraints shaped the page, each of them learned the hard way:

- **No native dialogs.** `alert`, `confirm` and `prompt` block the page and cannot be
  dismissed by anything driving the browser remotely. The page carries its own.
- **Options are picked with digits, commands with letters.** They shared an alphabet once,
  and typing into an unfocused page then selected options, jumped between fields and handed
  the round in.
- **Text saves as it is typed**, debounced, not on blur. The page stays open for hours and
  may be closed mid-sentence.

Answers identical to what is stored are dropped server-side, so a repeated save cannot reach
the assistant as a change.
