# How to improve the songs

How the songs Claude writes can get better, and where what is learned goes. Not a plan: each way
below needs the user's go before work starts.

## Why write down what Claude already knows

Claude knows the forms, styles and tracker techniques in general. Written knowledge (the skills, the
style guides) still matters, for four reasons:

1. **Claude cannot hear.** It knows what a fugue or a duty-cycle sweep is, not whether its own
   sounds good. What makes a song better comes from listening, and only a file carries it to the
   next job.
2. **Every job starts with no memory.** A skill or a guide is the only way something learned in one
   job reaches the next.
3. **Knowledge has to fit this toolchain.** Knowing "vibrato" is not knowing the Furnace effect,
   the depth that works on the SCC, or the levels that clip here.
4. **Claude's defaults are average.** Without direction it writes the most typical version of a
   style. Correct for the tracker is not the same as idiomatic.

So a line in a skill or a guide earns its place when it does one of these:

- says something about this setup (Furnace, the builder, levels);
- corrects something Claude got wrong;
- states a choice of taste.

A line that restates the textbook only costs tokens, and can override a better judgement in
context: there is no "how to write a fugue" skill.

## Skills and style guides

Not only a difference of names: who they are for and how they are used differ.

|         | Skill (`.claude/skills/`)                        | Style guide (`data/guides/`)                  |
| ------- | ------------------------------------------------ | --------------------------------------------- |
| Says    | how to do it right: craft, chip facts, the tools | what the user wants: taste                    |
| Applies | always, where it is relevant                     | chosen per prompt                             |
| Lives   | in the repository, with nothing personal in it   | in the data folder, edited on the Guides page |
| Kept    | as it is now                                     | copied into each song, as it was sent (0019)  |

To decide where a line belongs: would someone with other taste want it too? Then it is a skill;
otherwise a guide. Guides drift towards craft over time ("a fugue needs a hook passed between its
voices"), so lines move between them now and then to keep each clean.

## Default guides

Not offered: guides that describe a genre or a technique (fugue, boom-bap, ambient). They would
restate what Claude knows and carry nobody's taste.

Worth writing instead: **how a style fits onto a chip**, where general knowledge is thin and the
choices are concrete. For a fugue on the NES: which channel holds the subject, how the triangle's
missing volume control shapes the bass entry, what the drums give up when a voice is borrowed.
That goes in the chip skills, as idioms.

## Ways to improve, the strongest first

1. **Close the listening loop.** A keeper ★ says a song was liked, not why. A short note (a few
   words) on a song kept or deleted, and a regular pass that turns the notes into changes to the
   skills or guides, is the strongest lever. Most of the guides came about this way, by hand.
2. **Learn from the Furnace demos.** `references/furnace/demos/` holds songs by people who could
   hear them. Dumped as text (`fur/dump.ts`), they give measured idioms per chip: arpeggio speeds,
   vibrato depth and delay, duty and wave macros, drums built on the noise channel, echo channels.
   Grounded facts, though Claude still cannot judge the sound; a study job writes them as skill
   text for the user to review.
3. **Measure what can be measured.** The check could report more than level and peak: voices
   crowding one register, a lead that never rests, how much repeats, each channel's range. Stand-ins
   for flaws heard before, caught before rendering.
4. **A/B one technique at a time.** The same song with fast and slow arpeggios, or with and without
   the echo channel; the user picks, and the verdict goes into a skill.
5. **Fill the chip skills with techniques Claude can name but not yet tune.** Each needs a verdict
   from listening before it goes in as "this works":
   - **NES**: duty-cycle macros, a triangle kick with a pitch drop, short noise hi-hats, DPCM, an
     echo on a spare pulse, vibrato with a delay.
   - **SCC**: the choice of waves, wave-morph macros, detuned channel pairs for chorus, software
     volume envelopes.
   - **SID**: pulse-width modulation, filter sweeps, ring modulation and sync, hard restart,
     wavetable drums on one channel.
   - **Any tracker**: arpeggio (`0xy`), portamento, retrigger, delayed notes and note cuts, swing by
     alternating speeds, ghost notes in the volume column.

   Claude knows their names and their Furnace effects, not the values that sound good.
