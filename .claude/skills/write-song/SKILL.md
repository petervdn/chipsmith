---
name: write-song
description: Write chiptune songs for a chipsmith job from a prompt - reading the prompt, its style guides and structure, shaping sections (intro, verse, chorus, bridge, breakdown…), harmony, melody and groove for a few voices. Use first when a job asks for songs; it leads to furnace-song and the chip skills.
---

# Write a song

Where a job starts (Claude running headless from the app; the user is not at the terminal). This
skill is the music; the others are how it is written down:
- **furnace-song**: the job's script, the builder, rows and tempo, pitch, effects, macros, the check.
- One skill per chip the prompt names: **nes-chip**, **scc-chip**, **sid-chip**. Each has the
  chip's channels, instruments, idioms and levels.

## The prompt

- The prompt's own words come first. **Style guides** come with it, each under its name: they are
  the user's taste and win over any default here.
- "For the NES and the SCC" names the chips; read each chip's skill before writing for it.
- `Based on <title> [<id>]: …` changes an existing song: furnace-song, "A prompt based on a song".
- Before each step, say in one short line what you are about to do; the user sees these lines live.
- End with a short reply: what you made and anything the user should know.
- Work quickly: a set is minutes, not half an hour of measuring.

## The structure

A prompt may send a structure as a numbered line per section: its name, its bars, and what it is.
- A **letter** is a part; **A′, A″** are variations of A: the same material changed (a new
  counter-line, a fuller texture, the melody in another register, a reharmonised ending), still
  recognisably A. **A again** is A as it was; small fills at its edges are fine.
- **Role** says what the section is for, **energy** (1-5) how much is going on, a **note** anything
  else. Follow the bars exactly: the sections are cut by them later.
- **Led into … with** says how the section before leads into this one (a drum fill, the bass
  walking in, a borrowed chord, a pickup…): play it at the end of the section before, in its last
  bar or less, so it stays with that section when the song is cut. Where none is said, it is yours
  to choose, and a plain cut is fine.
- Without a structure, choose a form that fits the piece and the length.

## The harmony

A prompt may send a harmony: lines under "Harmony", for every song. What it leaves out is yours.
- **Key** and mode; without them, choose. **Chords** says their kind, colour, how often they change,
  the bass, the cadences and a key change.
- **Progressions** are Roman numerals on the major scale of the key (in A minor, ♭VI is F), the
  chord names after them, each chord's bars given. A part's progression repeats to fill its
  section; where its bars do not divide by it, end the section on a cadence. "The whole song" is
  for a song without a structure.
- **Variations** (A′) say how they end against their part's progression.
- **Follow it exactly**: play those chords, in that rhythm, in bass and harmony. **A starting
  point**: keep its key and character, change chords where the melody asks for it.
- Chords on a chip are implied (bass and arpeggios, a voice playing chord tones in turn); a
  seventh or a ninth needs a voice free for it. The prompt's own words win where they name a key
  or chords.

## What sections do

- **intro**: sets key, tempo and colour; often a part of the main idea, thinner. Short.
- **verse**: the main melody at moderate energy; leaves room to grow.
- **chorus**: the hook; the fullest and most memorable part, often higher and denser.
- **bridge**: contrast before a return: another key area or chord colour, a different rhythm or
  register, often thinner, ending with a turn back.
- **build**: rising energy: denser drums, rising lines, arpeggios speeding up, a held dominant.
- **drop**: the payoff after a build, full groove at once.
- **breakdown**: most parts out; bass and drums or one line alone, then rebuilding.
- **solo**: a lead improvises over the progression of another section.
- **climax**: the highest energy and register, all voices.
- **outro**: winds down or stops on a clear ending; or loops back seamlessly for a game loop.

## Writing for a few voices

- A chip has 3-5 voices; every voice counts. Chords are arpeggiated, implied by bass and melody, or
  played in turn by one voice (the chip skills say how on each chip).
- Give each voice a job: bass, lead, harmony or counter-line, drums. Change who does what between
  sections for contrast.
- Energy comes from density and register more than from volume: more notes, faster rhythms, higher
  lines, more voices playing.
- A hook is short (2-4 bars), rhythmic and repeated; vary its ending rather than its start.

## A set of songs

- **One song** of **40 s** unless the prompt says otherwise.
- **A set has real variety**: meter, tempo, groove (note values, drum pattern), form, texture and
  how layers enter differ between its songs, not only notes and sounds. Before writing, list per
  song what differs; if two share tempo, meter and groove, change one.

## Arrangement recipes that worked

- **Echo on a spare voice:** the same notes 3-4 rows later at volume 5-6.
- **Passing chord before a slow pad:** play it with a quick-attack instrument, and start the following
  chord a little louder than silence; otherwise the resolution falls into a dip.
- **Freeing a voice:** one voice can carry two chord tones in turn (first half / second half of the
  chord).
