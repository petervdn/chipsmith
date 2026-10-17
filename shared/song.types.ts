/**
 * A song: tracks of blocks, each block a clip placed at a time. A song points to clips by id and
 * holds nothing else of them (docs/adr/0005).
 */
import type { Status, Tag } from './catalogue.types.ts';
import type { SentGuide } from './guide.types.ts';

/** Ticks to a beat: a block's place and length are counted in them. */
export const TICKS_PER_BEAT = 96;

/** The part of a clip a block plays, in ticks from the clip's start; null in a Block is all of it. */
export type BlockTrim = { offset: number; length: number };

/** A clip placed on a track. */
export type Block = {
  clip: string;
  /** Where the block starts, in ticks from the song's start. */
  start: number;
  trim: BlockTrim | null;
  /** How many times the block plays, back to back. */
  repeats: number;
};

/** A row of the arrangement (docs/adr/0008: a track, not a channel). */
export type Track = { id: string; name: string; blocks: Block[] };

/** A song as its song.json holds it. */
export type Song = {
  id: string;
  title: string;
  created: string;
  updated: string;
  bpm: number;
  beats: number;
  tags: Tag[];
  status: Status;
  /** The prompt the song was made from, as written; never changed (docs/adr/0016). */
  prompt: string;
  /** The style guides sent with the prompt, as they were then (docs/adr/0019). */
  guides: SentGuide[];
  /** The song whose prompt was sent again to make this one, or null. */
  promptedFrom: string | null;
  tracks: Track[];
};
