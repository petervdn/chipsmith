/**
 * A song's harmony as a prompt asks for it: its scale (a mode on a note), its feel and colour in
 * plain words, and the progressions heard and kept, one per part of its structure or one for the
 * whole song. What is left out (null) is Claude's choice. What was sent with a prompt is copied into
 * the job and the songs it made.
 */
import { z } from 'zod';
import { normalizeNumeral } from './chord-numerals.ts';
import { COLOURS, FEELS } from './harmony-words.ts';
import { MODES, NOTES } from './modes.ts';
import { isChordLength } from './progression-notation.ts';

/** The letters a part can have. */
const LETTERS = /^[A-Z]$/;
/** The mode names there are. */
const MODE_NAMES = MODES.map(({ name }) => name);

/**
 * Returns a schema of a value that is one of a list.
 *
 * @param values - What it may be.
 * @returns The schema.
 */
function getOneOfSchema(values: string[]) {
  return z.string().refine((value) => values.includes(value), `is not one of ${values.join(', ')}`);
}

/** A chord of a progression: its numeral on the major scale of the key, written the one way, and its length in bars. */
export const chordSchema = z.object({
  numeral: z.string().transform((numeral, context) => {
    const normalized = normalizeNumeral(numeral);
    if (normalized) return normalized;
    context.addIssue({ code: 'custom', message: 'is not a chord' });
    return z.NEVER;
  }),
  bars: z.number().refine(isChordLength, 'is not a length a chord can have'),
});

/** A chord of a progression. */
export type Chord = z.infer<typeof chordSchema>;

/** A progression: its name, the mode it is written in, and its chords, at least one, in order. */
export const progressionSchema = z.object({
  name: z.string(),
  mode: getOneOfSchema(MODE_NAMES),
  chords: z.array(chordSchema).min(1, 'has no chords'),
});

/** A progression. */
export type Progression = z.infer<typeof progressionSchema>;

/** A progression kept for a part, or for the whole song. */
export const partProgressionSchema = z.object({
  /** The part's letter (A to Z), or null for the whole song. */
  letter: z.string().regex(LETTERS, 'is not A to Z').nullable().default(null),
  progression: progressionSchema,
});

/** A progression kept for a part, or for the whole song. */
export type PartProgression = z.infer<typeof partProgressionSchema>;

/** A harmony as it was sent with a prompt, copied; what is left out is Claude's choice. */
export const sentHarmonySchema = z.object({
  /** The key's note, or null for Claude's choice. */
  note: getOneOfSchema(NOTES).nullable().default(null),
  /** The mode (scale), or null for Claude's choice. */
  mode: getOneOfSchema(MODE_NAMES).nullable().default(null),
  /** The feel (shared/harmony-words.ts), or null. */
  feel: getOneOfSchema(FEELS.map(({ value }) => value))
    .nullable()
    .default(null),
  /** The colour (shared/harmony-words.ts), or null. */
  colour: getOneOfSchema(COLOURS.map(({ value }) => value))
    .nullable()
    .default(null),
  /** The progressions kept, each for a part or the whole song. */
  parts: z.array(partProgressionSchema).default([]),
});

/** A harmony as it was sent with a prompt, copied. */
export type SentHarmony = z.infer<typeof sentHarmonySchema>;
