# 0055. The model that composes is a setting of the app

- Status: accepted
- Date: 2026-10-23

## Context
0054 put a switch of the models beside Create on New, starting at Opus on every visit as New does
(0052). The model is not a choice about one prompt, though: it is how all composing is done until
it is changed, and a switch that goes back to Opus on every visit had to be set again each time.
Takes of a clip had no switch at all.

## Decision
- A Settings page (`/settings`, ⚙ in the top bar) holds the app's settings, each saved the moment
  it is chosen. For now one: the model that composes (Opus at first, Sonnet, Haiku).
- The settings are the server's, in the data folder (`settings.json`,
  `shared/app-settings.schema.ts`; read when asked for, so the next job sees a change), so every
  browser, the phone's too, sends jobs the same way. `GET`/`PATCH /api/settings`.
- A job takes the model from the settings when it is sent, songs and takes alike, and keeps it
  (`model` in job.json, 0054); the request carries none. New has no switch.

## Alternatives
- **The switch beside Create (0054).** Seen where a prompt is sent, but set again on every visit,
  and not for takes.
- **In the browser's preferences.** No server route, but the phone and the desktop would compose
  with different models without showing it.
- **In `.env` with the program settings (`config/settings.ts`).** Read once at start, changed by
  editing a file and restarting; those are where the programs are, not how the app composes.

## Consequences
New no longer shows which model will compose; the job's card shows it once sent. The Settings page
is where a later app-wide choice goes (an effort level, say).
