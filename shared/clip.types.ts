/**
 * A clip: one piece of audio in the shared pool, the whole of a piece or a slice of it by bars and
 * chip channels. A clip holds all of its own information, even what other clips repeat
 * (docs/adr/0004); its audio and source never change once made (docs/adr/0005).
 */
import type { Status, Tag } from './catalogue.types.ts';

/** The bars a clip covers, from the first to the one after the last; null in a Clip is the whole piece. */
export type BarRange = { from: number; to: number };

/** How a clip came from its parent: a new prompt on it, or cut out of it without one. */
export type ClipRelation = 'variation' | 'split';

/** The clip a clip was made from. */
export type ClipParent = { clip: string; relation: ClipRelation };

/** What a clip is called in the music: its section (A, B…) and its stem (Bass, Lead…); null when whole. */
export type ClipName = { section: string | null; stem: string | null };

/** A clip as its clip.json holds it. */
export type Clip = {
  id: string;
  created: string;
  /** The prompt the clip was made with, as written. */
  prompt: string;
  /** Shared by the clips one prompt made together; a label, never looked up. */
  promptId: string;
  name: ClipName;
  bars: BarRange | null;
  /** The chip channels the clip holds, by number in its source.fur; null is all of them. */
  channels: number[] | null;
  parent: ClipParent | null;
  /** The song the clip was made in; for information, nothing depends on it. */
  madeFor: string | null;
  tags: Tag[];
  status: Status;
  bpm: number;
  beats: number;
  key: string | null;
  /** The chips its source plays on, as Furnace names them. */
  chips: string[];
  seconds: number;
  /** The Furnace version the audio was rendered with; null for audio that came without a source. */
  furnace: string | null;
};
