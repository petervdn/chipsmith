# Code guidelines

How code is kept clean here: the rules to write by. Taken over from unknown-game (docs/adr/0012) and
cut to what applies. A rule that is not followed is taken out, not left to rot.

## Files

- **One subject to a file**, named after it, with a comment at its head saying what it is and what it
  knows nothing of. A component is `PascalCase.tsx`; any other module is `kebab-case.ts`.
- **No file is longer than 400 lines**; `test/layout.test.ts` holds it. A file past about 250 lines
  is looked at for a second subject. Signs of one: the comment at the head needs an "and"; groups of
  functions that share no state; a reader of one part who never needs the other. The cut follows the
  data, never the line count.
- **A subject's kinds of things go beside it, named by a role after a dot**: `clip.schema.ts`,
  `list-filter.test.ts`. No folders by kind of syntax (`types/`, `utils/`).
- **Every folder of the source has a README.md** naming each file and folder in it, one line each
  (`- \`name.ts\`: what it is`); the layout test holds it.
- **An import names its file with its extension** (`./store.ts`, `./App.tsx`): Node runs the
  TypeScript as it is (the tests, and Vite's config with the server) and finds nothing else.
- **A move is a commit of its own** that changes no behaviour.
- **No barrel files**: no `index.ts` that only re-exports a folder. An import names the file the thing
  is in (`./jobs/JobCard.tsx`), so there is one place to find it and no cycle runs through a barrel
  (docs/adr/0020).

## The page's folders

How `src/` is laid out (docs/adr/0020):

- **A folder per area of the app**: a page, or a part several pages show (the top bar, the player,
  the lists). It holds everything of that area: its components, their CSS, its hooks, the modules
  that know no page, and their tests. No folders by kind (`components/`, `hooks/`, `styles/`).
- **A folder can hold more than one component** when they belong together (a page and the parts
  only it shows). A component that another area uses too stays in the area it belongs to most; one
  that is an area of its own (the player bar) gets its own folder.
- **A component's CSS is beside it, named after it** (`JobCard.css` beside `JobCard.tsx`) and
  imported by the component itself, so its styles come and go with it. Its classes start with its
  name in kebab-case (`.job-card`, `.job-card-head`), or the area's for what the area's components
  share. `src/style.css` holds only the tokens and the base (the page, links, form controls).
- **What every area uses stays in folders of its own**: `queries/` (the server's data), `stores/`,
  `playback/`. The app's shell (`main.tsx`, `App.tsx`, the router, the page title) is at the top
  of `src/`.

## Logic apart from the page

- **What can be worked out without the page is a module that does not know the page**: given values,
  gives values (`list-filter.ts`, `song-length.ts`, `router.ts`'s `getRoute`). A component asks it and
  shows the answer. Such a module has its test beside it.
- **What the server and the page both know is in `shared/`**, which reads no files and touches no page.
- **A module says what it needs as arguments**; it does not reach for another's state.

## React

- **A component is a function declaration**, exported by name, its props a `type` named
  `<Component>Props` and destructured in the signature.
- **A component orchestrates the page; it holds no business logic.** It takes values and handlers
  from hooks and lays them out: the markup, which handler goes on which control, and state that is
  only the view's (a row open, a copy just done). What it would work out goes to one of two places:
  - **a function in a module that knows no page**, tested beside it: filtering, sorting by a rule,
    lengths, text made from data, routes ("Logic apart from the page");
  - **a hook**, for logic that needs React: queries and mutations used together by a rule, effects
    and timers, the address, a store's actions in turn. It calls those functions and gives the
    component values and handlers ready to use.
- **A hook is a subject of its own**: `use-<what>.ts` beside what uses it (`use-list-filter.ts`), not
  inside a component's file.
- **What a component keeps is declared at its head** (its `useState`s), before what it does.

## State

Where state lives, in this order (why: docs/adr/0017):
1. **Local** (`useState`) in the component that uses it.
2. **Lifted** to the nearest common parent, while the props stay few.
3. **Context** for a value a subtree needs and that changes rarely.
4. **A Zustand store** (`src/stores/`, one per concern, actions beside the state) when lifting means
   props through many layers or the state is the whole app's; components subscribe with a selector.
5. **The address** only where navigation matters (a list's filter).

- **The server's data is TanStack Query** (queries and mutations, `src/queries/`); never copied into a
  store. Every key comes from `getQueryKey({ type: … })` (`src/queries/client.ts`), one object
  parameter typed as a union over `type`; a new kind of read is a new case there.
- **Components never touch storage**: what survives a reload is a store with `persist`
  (`partialize` what survives, `version` its shape).

## Names

- **A name ends in what the thing is**, with what tells it apart before it: `songId`, `clipFolder`,
  `temporaryFile`. No abbreviations but `x y i j` and `id`; no `data`, `info`, `item`, `utils` alone.
- **A function is named by a verb for what it does**: `get` for most that give a thing back, another
  verb where it says it better (`openStore`, `saveSong`, `checkClip`). A boolean starts with `is`, `has`
  or `can`.
- **UPPER_SNAKE_CASE is for a module-level constant fixed when it is written** (`TICKS_PER_BEAT`,
  `LIMIT`); everything else is camelCase.
- **A type parameter is named for what it is** (`Item`, `Answer`), not `T`.

## One thing to a function

- **A function does one thing**; a name that needs "and" is two functions.
- **A named function is a `function` declaration**; an arrow function only as an argument.
- **An object parameter is destructured in the signature.**
- **A `Record<string, …>` is for keys that are data**, chosen at run time. Keys known when written are
  an object type with those keys.
- **No `as` to make a type fit.** The type is put right, or its schema parses the value at run time
  (`parseChecked`, "Data from outside"). An exception is written where it is, with an
  `eslint-disable-next-line` and its reason beside it.
- **No `!`.** An index read that may miss is handled as the case it is.

## Numbers

- **A number that means something has a name**: a module-level constant (`TICKS_PER_BEAT`, `PORT`).

## Data from outside

- **What comes in from a file or a request is parsed by its Zod schema where it comes in**
  (`parseChecked`, `shared/schema-parse.ts`; docs/adr/0038). A file that does not fit is reported
  with the field that is wrong.
- **The schema is the source of truth**: its type is inferred from it (`z.infer`), never written
  beside it. Schemas are in `shared/<subject>.schema.ts`, the comments on the fields on the schema's
  keys; a schema only one side uses sits with its subject (`make/song-plan.ts`).
- **What is not validated is a plain type**, written by hand: the server's answers, what is worked
  out in the code. A schema is not written for a shape nothing parses.
- **The page imports only types from a schema file** (`import type`), so Zod stays out of its
  bundle; a constant it needs at run time is in a module of its own (`shared/ticks.ts`).
- **The page trusts the server's typed answers** (`shared/api.types.ts`); the server is where the
  parsing is.

## Comments

- **Every export has a `/** */` saying what it is**, in plain sentences.
- **A function's comment is full JSDoc** (docs/adr/0021): a sentence saying what it does ("Returns
  the tick at which a block's last repeat ends."), then a `@param` for every parameter and a
  `@returns` for what it gives back, each with a description. No types in the tags: TypeScript has
  them.
  - A destructured parameter is named in the tags and each of its fields gets one:
    `@param block - The block placed.` and `@param block.start - Where it starts, in ticks.`
  - A component documents its props the same way (`@param props.song - …`) and returns "the …
    element".
  - A function that returns nothing, or a promise of nothing, has no `@returns`.
  - `npm run lint` checks that every parameter and the return have their tag.

```ts
/**
 * Returns the tick at which a block's last repeat ends.
 *
 * @param block - The block, with its start, trim and repeats.
 * @param block.start - Where the block starts, in ticks.
 * @param block.trim - The part of the clip it plays, or null for all of it.
 * @param block.repeats - How many times it plays, back to back.
 * @param clipSeconds - The length of the block's clip, in seconds.
 * @param bpm - The song's tempo.
 * @returns Where the last repeat ends, in ticks from the song's start.
 */
```
- **A comment of more than one line is a block**; `//` only for one line.

## One of each

- **Look before writing**: use what already does it.
- **The second use is when a thing becomes a function.** A block is never copied a third time.
- **A new case is an entry in a list, not a branch**, where a list already holds such cases.
- **A fact is kept in one place.** What can be worked out from where it is kept (a clip's tempo or
  channels from its source.fur, its length from its audio) is worked out when it is needed, not
  stored beside it. A copy that has to be kept in step with its source (written twice, filled in
  later, copied from another record) is the last choice: it is taken only when nothing else works,
  and asked about first, with the other ways and why they fail; the decision is an ADR.
  - Not a copy in this sense: a record of how something was at a moment, which never changes
    after (the guides as they were sent, 0019; a clip's own prompt, 0004).

## Commits

Taken over from unknown-game.

- **A change is committed when it is done**: when it works and `npm run check` passes, it is a
  commit, before the next change starts. Finished work is not left lying in the working tree.
- **One subject to a commit**: changes that belong together go in one commit (the code, its docs,
  its ADR, the examples it touches), and changes that do not go in commits of their own, even when
  they were made in one sitting. If the title needs an "and" or an "also", it is two commits.
- **A commit holds everything the change touched**: a move rewrites imports in other folders, so
  `git status` is clean of that change after its commit.
- **A short title, a blank line, then a body.** Not one long line.
  - **Title**: `type(area): what it does`, in at most about 60 characters, the part after the colon
    in the imperative so that "This commit will …" reads before it ("show the jobs on a page of
    their own"), starting lower case. No names of functions or files, no full stop. Commits before
    2026-10-17 are statements without a type; they stay as they are.
  - **type**: `feat` (something new to see or use), `fix` (something wrong made right), `refactor`
    (structure changed, behaviour the same: a move is one), `perf` (faster, the measurement before
    and after in the body), `docs` (docs, ADRs, comments only), `test` (tests only), `chore`
    (scripts, config, formatting, dependencies). A change that needs two types is two commits.
  - **area**: `page`, `server`, `jobs`, `fur`, `make`, `render`, `examples`, `config`, in lower
    case; left out where the type says enough (`docs: record why the page is grouped by area`).
  - **Body**: what was done and why, wrapped at about 100 characters, as short paragraphs or a list
    of `-` items. Names of functions, files and ADRs go here.

```
feat(page): show the jobs on a page of their own

New is only the prompt now; sending it leads to Jobs (`/jobs`, `JobsPage.tsx`), where every prompt
sent is a card, newest first.

- A job that is over can be removed (✕); `removed` is set in its job.json and its files stay.
- The Jobs tab counts the jobs on their way.
```

## Tests

- **Logic that knows no page has tests** where a mistake would lose or mix up work: what goes into a
  file and comes out (`store.test.ts`), what filters a list, what a route reads as.
- **A bug in such logic is first a test that fails**, then the fix.

## The page

- **Phone and desktop alike**: one column on a phone, rows that wrap; a control 32 px tall with a
  mouse and 36 px under a finger (`--touch`), an option pill 28 px and 32 px (`--pill`); on a
  desktop a row is one line. Nothing scrolls sideways.
- **Colours are tokens** on `:root`, with a dark set under `prefers-color-scheme: dark` and under
  `data-look="dark"` (the top bar's switch).
- **A control that does not say what it does gets a tooltip**: `data-tooltip`, shown by the page's
  own tooltip (`src/tooltip/`), never `title`.
- **Icons are Lucide's** (`lucide-react`, imported by name), never drawn by hand (docs/adr/0027).
- **Nothing pops up from the browser**: a question before a change is `askToConfirm`
  (`src/stores/confirm-store.ts`), never `window.confirm`, `alert` or `prompt` (docs/adr/0026).
