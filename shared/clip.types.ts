/**
 * A clip: one piece of audio in the shared pool, the whole of a piece or a slice of it by bars and
 * chip channels. A clip holds all of its own information, even what other clips repeat
 * (docs/adr/0004): its record, and what its source says, read from it (docs/adr/0024). Its audio and
 * source never change once made (docs/adr/0005).
 */
import type { Status, Tag } from './catalogue.types.ts';
import type { SentGuide } from './guide.types.ts';

/** The bars a clip covers, from the first to the one after the last; null in a Clip is the whole piece. */
export type BarRange = { from: number; to: number };

/** How a clip came from its parent: a new prompt on it, or cut out of it without one. */
export type ClipRelation = 'variation' | 'split';

/** The clip a clip was made from. */
export type ClipParent = { clip: string; relation: ClipRelation };

/** What a clip is called in the music: its section (A, B…) and its stem (Bass, Lead…); null when whole. */
export type ClipName = { section: string | null; stem: string | null };

/**
 * A clip as its clip.json holds it: what only the clip's record can say. What its source.fur says is
 * read from it, never stored (ClipFacts, docs/adr/0024).
 */
export type ClipRecord = {
  id: string;
  created: string;
  /** The prompt the clip was made with, as written. */
  prompt: string;
  /** The style guides sent with the prompt, as they were then (docs/adr/0019). */
  guides: SentGuide[];
  /** Shared by the clips one prompt made together; a label, never looked up. */
  promptId: string;
  name: ClipName;
  bars: BarRange | null;
  parent: ClipParent | null;
  /** The song the clip was made in; for information, nothing depends on it. */
  madeFor: string | null;
  tags: Tag[];
  status: Status;
  key: string | null;
  /** The Furnace version its audio was rendered with; null until it is rendered. */
  furnace: string | null;
};

/** What a clip's source.fur says of its music, read from it when the clip is read (docs/adr/0024). */
export type ClipFacts = {
  bpm: number;
  beats: number;
  /** The chips its source plays on, as Furnace names them. */
  chips: string[];
  /** The chip channels that play in its source, by number. */
  channels: number[];
  /** Its length, from its source's rows and speed. */
  seconds: number;
};

/** A clip: its record, and the facts read from its source. */
export type Clip = ClipRecord & ClipFacts;
