/**
 * A reference: a song someone else wrote in Furnace (one of Furnace's demos), kept to listen to,
 * channel by channel, and to write what is liked in it. Not a song of the app: no prompt made it,
 * and it is never edited. Its facts (name, chips, channels, length) are read from its files.
 */
import { z } from 'zod';

/** A reference as references/<id>/reference.json holds it. */
export const referenceSchema = z.object({
  id: z.string(),
  /** The .fur it was copied from, relative to the project. */
  file: z.string(),
  imported: z.string(),
  /** What the user hears in it and likes or not, in their own words. */
  notes: z.string(),
});

/** A reference as references/<id>/reference.json holds it. */
export type Reference = z.infer<typeof referenceSchema>;

/** Which of the app's chips a reference is listed under. */
export type ChipFamily = 'nes' | 'sid' | 'scc';
