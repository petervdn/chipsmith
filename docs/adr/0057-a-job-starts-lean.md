# 0057. A job's Claude starts lean

- Status: accepted
- Date: 2026-10-23

## Context
A job's Claude started as an interactive Claude Code does: about 30 tools' definitions, every skill
installed listed, MCP servers, the project's `CLAUDE.md` with the architecture and the code
guidelines (rules for building the app, not for composing), and the user's own `CLAUDE.md` and
memory. Its first request was about 57k tokens; every turn sends it again.

## Decision
`claude-run.ts` starts it with only the tools a job uses (`--tools` Read, Glob, Grep, Write, Edit,
Bash; `JOB_TOOLS`), no settings sources (`--setting-sources ""`: no CLAUDE.md, settings or memory
of the project's or the user's), no skills or commands (`--disable-slash-commands`; they are in the
system prompt, 0056) and no MCP servers (`--strict-mcp-config`). What it may do without asking
stays `--allowedTools`. Measured on a short run: 52k tokens to 9k without the skills; a job's first
request with them is about 24k.

## Alternatives
- **`--bare`.** Leaner still, but it reads no OAuth or keychain: it needs an API key, which this
  app does not have.
- **Keep the defaults.** Nothing to keep in step with, but every turn carries what the job never
  uses, and the user's personal instructions reach the composer.

## Consequences
A composing rule written only in `CLAUDE.md` no longer reaches a job: it belongs in a skill. A
tool a job needs is added to `JOB_TOOLS`.
