# 0042. A clip is rendered with a headless Furnace build; the app only opens files

- Status: accepted
- Date: 2026-10-18

## Context
Clips were rendered with the Furnace app's binary (0015). It sets up a CoreMIDI client every time it
starts; now and then macOS refuses, RtMidi throws where nothing catches it, and Furnace aborts. The
retry made the render work, but each abort left a "Furnace quit unexpectedly" dialog: 26 crash
reports from 2026-10-15 to 2026-10-18, every one in `MidiInCore::getCoreMidiClientSingleton`, found
waiting on the screen after a day of work from a phone.

A build of Furnace 0.6.8.3 without its GUI, SDL and RtMidi (README.md, "A headless Furnace") links no
CoreMIDI. Rendering two NES examples twice with each build: each build gives the same bytes every
run; the two agree byte for byte on every channel but the NES noise, which has the same length,
timing and level (RMS within 0.3%) and a different sequence of samples. Heard alternated with the
app's (2026-10-18), the noise sounds the same.

## Decision
- `CHIPSMITH_FURNACE` is the Furnace that renders: set to the headless build. Its default stays the
  app, so a new checkout renders without building Furnace.
- `CHIPSMITH_FURNACE_APP` is the app that opens a clip's .fur to look at (`server/clip-files.ts`),
  checked as a program of its own; by default the app in `/Applications`.
- The retries stay: they cost nothing when a render works, and the app's binary still needs them.

## Alternatives
- **Keep the app's binary and hide the dialogs** (`defaults write com.apple.CrashReporter DialogType
  none`). Turns off crash dialogs for every program, and the aborts go on.
- **Catch the failure in Furnace's source.** A patch to keep up with every Furnace version, for MIDI
  input a render never uses.

## Consequences
- A clip records "0.6.8.3" whichever build rendered it; clips rendered from 2026-10-18 on this
  computer are the headless build's, so their NES noise differs in its samples from earlier ones.
- With no app start that can fail, renders could run side by side; they still run one at a time.
