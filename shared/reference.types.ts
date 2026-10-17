/**
 * A reference: a song someone else wrote in Furnace (one of Furnace's demos), kept to listen to,
 * channel by channel, and to write what is liked in it. Not a song of the app: no prompt made it,
 * and it is never edited. Its facts (name, chips, channels, length) are read from its files.
 */

/** A reference as references/<id>/reference.json holds it. */
export type Reference = {
  id: string;
  /** The .fur it was copied from, relative to the project. */
  file: string;
  imported: string;
  /** What the user hears in it and likes or not, in their own words. */
  notes: string;
};

/** Which of the app's chips a reference is listed under. */
export type ChipFamily = 'nes' | 'sid' | 'scc';
