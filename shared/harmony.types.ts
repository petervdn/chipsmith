/**
 * A song's harmony as a prompt asks for it: its key, how its chords are (harmony-settings.ts), and a
 * progression per part of its structure, or one for the whole song. What is left out (null) is
 * Claude's choice. What was sent with a prompt is copied into the job and the songs it made.
 */
import type {
  HarmonySettingName,
  HarmonyValue,
  Strictness,
  VariationEnding,
} from './harmony-settings.ts';

/** A chord of a progression: its numeral on the major scale of the key, and its length in bars. */
export type Chord = { numeral: string; bars: number };

/** A progression: its name (a preset's, "rolled" or "your own") and its chords, in order. */
export type Progression = { name: string; chords: Chord[] };

/** The settings of a harmony, each a value or null for Claude's choice. */
export type HarmonySettings = { [Name in HarmonySettingName]: HarmonyValue<Name> | null };

/** The harmony of a part, or of the whole song. */
export type PartHarmony = {
  /** The part's letter (A to Z), or null for the whole song. */
  letter: string | null;
  /** Its progression, repeated to fill its bars, or null for Claude's choice. */
  progression: Progression | null;
  /** How its variations (A′, A″) end. */
  variation: VariationEnding;
};

/** A harmony as it was sent with a prompt, copied. */
export type SentHarmony = {
  /** The key's note, or null for Claude's choice. */
  note: string | null;
  /** The key's mode, or null for Claude's choice. */
  mode: string | null;
  settings: HarmonySettings;
  strictness: Strictness;
  /** The parts with a progression or a variation's ending asked for. */
  parts: PartHarmony[];
};
