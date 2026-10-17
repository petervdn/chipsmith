/**
 * A song's harmony as a prompt asks for it: its scale (a mode on a note), its feel and colour in
 * plain words, and the progressions heard and kept, one per part of its structure or one for the
 * whole song. What is left out (null) is Claude's choice. What was sent with a prompt is copied into
 * the job and the songs it made.
 */

/** A chord of a progression: its numeral on the major scale of the key, and its length in bars. */
export type Chord = { numeral: string; bars: number };

/** A progression: its name, the mode it is written in, and its chords, in order. */
export type Progression = { name: string; mode: string; chords: Chord[] };

/** A progression kept for a part, or for the whole song. */
export type PartProgression = {
  /** The part's letter (A to Z), or null for the whole song. */
  letter: string | null;
  progression: Progression;
};

/** A harmony as it was sent with a prompt, copied. */
export type SentHarmony = {
  /** The key's note, or null for Claude's choice. */
  note: string | null;
  /** The mode (scale), or null for Claude's choice. */
  mode: string | null;
  /** The feel (shared/harmony-words.ts), or null. */
  feel: string | null;
  /** The colour (shared/harmony-words.ts), or null. */
  colour: string | null;
  /** The progressions kept, each for a part or the whole song. */
  parts: PartProgression[];
};
