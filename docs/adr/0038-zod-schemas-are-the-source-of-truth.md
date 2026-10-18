# 0038. Data that is validated is a Zod schema, and its type is inferred from it

- Status: accepted
- Date: 2026-10-18

## Context
What comes in from a file or a request is checked where it comes in (docs/code-guidelines.md, "Data
from outside"). The checks were written by hand: a TypeScript type in `shared/`, and beside it, in
`server/model-checks.ts`, `harmony-checks.ts`, `structure-checks.ts` and the routes, a function that
built the same shape field by field from `unknown` (`server/json-checks.ts`), about 600 lines. Each
shape was so written twice, and nothing held the two together: a field added to a type could be
forgotten in its check (`variationLabel` needed both, 0036), and a file read without a check
(`job.json`) filled its missing fields with `?? null` by hand. No ADR recorded why it was done by
hand rather than with a library; it was never weighed.

## Decision
- **Data that is validated is a Zod schema**, and the schema is the source of truth: its type is
  inferred from it (`export type Song = z.infer<typeof songSchema>`), never written beside it, so
  the two cannot drift apart. Validated is what comes in from outside the code: a file the app
  reads (clip.json, song.json, job.json, guide.json, structure.json, reference.json, a job's
  plans) and a request's body.
- **Data that is not validated is a plain type**, written by hand as before: what the server
  answers (`shared/api.types.ts`, which the page trusts), what is worked out in the code (a clip's
  facts read from its .fur, 0024), what only lives in memory. A schema is not written for a shape
  nothing parses.
- **Schemas are in `shared/`, a file per subject named `<subject>.schema.ts`**, holding the schemas
  and the types inferred from them (`clip.schema.ts` takes the place of `clip.types.ts`); what a
  request sends is in `api-requests.schema.ts`. A schema only one side uses sits with its subject
  (a job script's plans, `make/song-plan.ts`). The comments on the fields are on the schema's
  keys, and carry over to the inferred types.
- **What a schema can say, it says**: defaults for fields older files lack (`.default(null)` in
  place of `?? null`), trimming, bounds, the lists a value is one of, and rules across fields (a
  variation has a label and no other clip has one, `.superRefine`). A rule that needs the store
  (the clip a request changes, the song that plays a clip) stays in the route.
- **One helper parses and reports** (`parseChecked`, `shared/schema-parse.ts`): it throws an error
  that names where the value came from and the field that is wrong, as the checks did
  (`…/clips/c0002/clip.json: parent.clip: …`).
- **The page imports only types from a schema file** (`import type`, which
  `verbatimModuleSyntax` erases), so Zod stays out of its bundle; a constant the page needs at run
  time lives in a module of its own, not in a schema file.
- Zod 4, pinned (`4.6.5`, a month old when chosen), with `.exactOptional()` for optional fields,
  as the project's `exactOptionalPropertyTypes` asks.

## Alternatives
- **Checks by hand, as before.** No dependency, but every shape twice, and the two kept in step by
  hand.
- **io-ts.** Types from codecs too, but it brings fp-ts and `Either` plumbing for what is plain
  validation, and is kept up less now that its author works on Effect Schema.
- **Valibot.** The same idea, smaller in a browser bundle; validation here runs on the server, so
  its one edge does not count, and Zod is the one the user knows.
- **Effect Schema.** The most able (it encodes as well as decodes), but it brings the Effect
  ecosystem for reading JSON files and request bodies.
- **ArkType, TypeBox.** Fine, less known, nothing here they do better.
- **A schema for every type, the server's answers too.** A schema nothing parses is a type with
  extra steps; the page trusts the server's typed answers (docs/code-guidelines.md).

## Consequences
`server/json-checks.ts` and the check modules go; the routes and the readers parse with the
schemas. `shared/*.types.ts` files that held validated shapes become `*.schema.ts`; those that hold
only plain types keep their name. A new field of a file or a request is written once, in its
schema. Error messages read as Zod's, with the file and the field in front. A job.json is now
parsed too: one whose harmony no longer fits (from before progressions had their mode) reads it as
none (`.catch(null)`), as a job is a log and is kept.
