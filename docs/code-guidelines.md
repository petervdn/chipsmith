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
- **A subject's kinds of things go beside it, named by a role after a dot**: `clip.types.ts`,
  `list-filter.test.ts`. No folders by kind of syntax (`types/`, `utils/`).
- **Every folder of the source has a README.md** naming each file and folder in it, one line each
  (`- \`name.ts\`: what it is`); the layout test holds it.
- **An import names its file with its extension** (`./store.ts`, `./App.tsx`): Node runs the
  TypeScript as it is (the tests, and Vite's config with the server) and finds nothing else.
- **A move is a commit of its own** that changes no behaviour.

## Logic apart from the page

- **What can be worked out without the page is a module that does not know the page**: given values,
  gives values (`list-filter.ts`, `song-length.ts`, `router.ts`'s `getRoute`). A component asks it and
  shows the answer. Such a module has its test beside it.
- **What the server and the page both know is in `shared/`**, which reads no files and touches no page.
- **A module says what it needs as arguments**; it does not reach for another's state.

## React

- **A component is a function declaration**, exported by name, its props a `type` named
  `<Component>Props` and destructured in the signature.
- **A component shows; it does not work things out.** Filtering, sorting by a rule, lengths, routes:
  a function in a module, called from the component.
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
- **No `as` to make a type fit.** The type is put right, or a function checks the value at run time and
  narrows it (`server/json-checks.ts`). An exception is written where it is, with an
  `eslint-disable-next-line` and its reason beside it.
- **No `!`.** An index read that may miss is handled as the case it is.

## Numbers

- **A number that means something has a name**: a module-level constant (`TICKS_PER_BEAT`, `PORT`).

## Data from outside

- **What comes in from a file or a request is checked where it comes in**, field by field, into its
  type (`server/model-checks.ts`). A file that does not fit is reported with the field that is wrong.
- **The page trusts the server's typed answers** (`shared/api.types.ts`); the server is where the
  checks are.

## Comments

- **Every export has a `/** */` saying what it is**, the description alone: no `@param`, `@returns`.
- **A comment of more than one line is a block**; `//` only for one line.

## One of each

- **Look before writing**: use what already does it.
- **The second use is when a thing becomes a function.** A block is never copied a third time.
- **A new case is an entry in a list, not a branch**, where a list already holds such cases.

## Tests

- **Logic that knows no page has tests** where a mistake would lose or mix up work: what goes into a
  file and comes out (`store.test.ts`), what filters a list, what a route reads as.
- **A bug in such logic is first a test that fails**, then the fix.
- **`npm run check` passes before a commit.**

## The page

- **Phone and desktop alike**: one column on a phone, rows that wrap, touch targets of 40 px
  (`--touch`); on a desktop a row is one line. Nothing scrolls sideways.
- **Colours are tokens** on `:root`, with a dark set under `prefers-color-scheme: dark`.
- **A control that does not say what it does gets a tooltip.**
