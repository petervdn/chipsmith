# 0020. The page is grouped by area; a component's CSS is beside it; no barrel files

- Status: accepted
- Date: 2026-10-17

## Context
`src/` had grown to sixteen components, six CSS files split by a loose idea of a page, hooks and
modules side by side in one folder, and the pages in `pages/` away from the parts only they show.
Finding what a page is made of meant reading most of the folder, and the CSS of one component was
spread over two files.

## Decision
`src/` has a folder per area of the app (a page, or a part several pages show), holding its
components, their CSS, hooks, page-free modules and tests. A component's CSS is a file beside it,
named after it and imported by it. No barrel files: an import names the file the thing is in.
The rules are in docs/code-guidelines.md, "The page's folders".

## Alternatives
- **Folders by kind** (`components/`, `hooks/`, `styles/`). Familiar, but one change touches three
  folders, and nothing shows what belongs to what.
- **One CSS file per area, or one for the app.** Fewer files, but a component's styles are not
  where it is, and dead rules stay when a component goes.
- **An `index.ts` per folder.** Shorter imports, but two names for every thing, cycles through the
  barrel, and a folder's insides hidden behind a list that has to be kept.

## Consequences
The move of the existing files is a commit of its own. `main.tsx` imports only `style.css`; each
component brings its own. Class names are renamed to their component where they are not yet.
