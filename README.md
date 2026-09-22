# claude

A collection of `CLAUDE.md` templates for [Claude Code](https://claude.ai/code).

Each file is a ready-to-use starting point — copy it into your project root as `CLAUDE.md` and adjust to fit.

## Templates

| File | Use for |
|------|---------|
| [CLAUDE-general.md](CLAUDE-general.md) | Any project — base conventions, secrets, git, and how to measure a change |
| [CLAUDE-frontend.md](CLAUDE-frontend.md) | React / Next.js / Vite + TanStack + Tailwind |
| [CLAUDE-backend-node.md](CLAUDE-backend-node.md) | Fastify + TypeScript + Postgres (Kysely), one file per endpoint |
| [CLAUDE-react-native.md](CLAUDE-react-native.md) | Expo / React Native + Expo Router + TanStack Query |

## Skills

| Skill | What it does |
|-------|--------------|
| [skills/ask](skills/ask/) | Asks you a round of questions in a local browser page that stays open across turns — options with their consequences side by side, diagrams, a sketch pad, and a live channel for Claude to push explanations back in |

Copy a skill folder into a project's `.claude/skills/`, or point at it from your global
Claude config.

## Spec

| File | What it is |
|------|------------|
| [spec/_TEMPLATE.md](spec/_TEMPLATE.md) | The document template for a `SPEC/` tree — one file per feature, architecture piece or decision |

Copy it into a project as `SPEC/_TEMPLATE.md` and keep a router (`SPEC/SPEC.md`) beside it: what is
not listed there does not exist. The template carries the header fields, the difference between a
feature and an architecture doc, and the rules that keep a spec honest — the three ways to write
something that is not decided yet, numbers as promises, silence is not a rejection, and a criterion
nobody runs is dead text.

Written in Czech, like the specs it describes.

## Templates, continued

`CLAUDE-general.md` is meant to be combined with one of the others: keep it at the repo root and put
the stack-specific file next to the app it describes (`backend/CLAUDE.md`, `apps/mobile/CLAUDE.md`).

## Updates

Files are versioned with a `Last updated` date at the top. When you copy a template into a new project, Claude will offer to set up a weekly check against this repo to notify you of new versions.
