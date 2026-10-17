# 0027. The page's icons come from Lucide

- Status: accepted
- Date: 2026-10-17

## Context
The page's two icons, the prompt builder's lock and the jobs' trash can, were drawn by hand as small
SVG components. They did not look as good as a drawn icon set, and every new icon would be drawn
again, each a little different.

## Decision
Icons come from `lucide-react` (pinned, `npm install --save-exact`), imported one by one by name
(`import { Trash2 } from 'lucide-react'`) and sized where they are used. No icon is drawn by hand.

## Alternatives
- **Drawing our own.** No dependency, but not as pretty, and no two drawn alike.
- **Another set** (Heroicons, Phosphor, Tabler). Lucide is the largest of the stroke sets with
  React components, keeps one look across all its icons, and only the icons imported end up in the
  app.
- **Unicode symbols** (✕, ★, ▶), as several controls still are. They look different from font to
  font and system to system.

## Consequences
One more dependency in the page. The controls that are still Unicode symbols (▶ ■ ↶ ↷ « » ▸ ☾ ☀ ★ ☆)
can move to Lucide icons when they are next touched.
