/**
 * A song: tracks of blocks, each block a clip placed at a time. A song points to clips by id and
 * holds nothing else of them (docs/adr/0005).
 */
import { z } from 'zod';
import { statusSchema, tagSchema } from './catalogue.schema.ts';
import { sentGuideSchema } from './guide.schema.ts';
import { sentHarmonySchema } from './harmony.schema.ts';
import { sentStructureSchema } from './structure.schema.ts';

/** The part of a clip a block plays, in ticks from the clip's start; null in a Block is all of it. */
export const blockTrimSchema = z.object({ offset: z.number(), length: z.number() });

/** The part of a clip a block plays. */
export type BlockTrim = z.infer<typeof blockTrimSchema>;

/** A clip placed on a track. */
export const blockSchema = z.object({
  clip: z.string(),
  /** Where the block starts, in ticks from the song's start. */
  start: z.number(),
  trim: blockTrimSchema.nullable(),
  /** How many times the block plays, back to back. */
  repeats: z.number(),
});

/** A clip placed on a track. */
export type Block = z.infer<typeof blockSchema>;

/** A row of the arrangement (docs/adr/0008: a track, not a channel). */
export const trackSchema = z.object({
  id: z.string(),
  name: z.string(),
  /**
   * Its level in decibels, set by its fader: 0 plays its clips as rendered. Heard in playback only;
   * the clips' audio never changes. A song saved before tracks had a level plays at 0 dB.
   */
  volume: z.number().default(0),
  blocks: z.array(blockSchema),
});

/** A row of the arrangement. */
export type Track = z.infer<typeof trackSchema>;

/** A song as its song.json holds it; what older files leave out is read as none. */
export const songSchema = z.object({
  id: z.string(),
  title: z.string(),
  created: z.string(),
  updated: z.string(),
  bpm: z.number(),
  beats: z.number(),
  tags: z.array(tagSchema),
  status: statusSchema,
  /** The prompt the song was made from, as written; never changed (docs/adr/0016). */
  prompt: z.string(),
  /** The style guides sent with the prompt, as they were then (docs/adr/0019). */
  guides: z.array(sentGuideSchema).default([]),
  /** The structure sent with the prompt, as it was then, or null. */
  structure: sentStructureSchema.nullable().default(null),
  /** The harmony sent with the prompt, as it was then, or null. */
  harmony: sentHarmonySchema.nullable().default(null),
  /** The song whose prompt was sent again to make this one, or null. */
  promptedFrom: z.string().nullable().default(null),
  tracks: z.array(trackSchema),
});

/** A song as its song.json holds it. */
export type Song = z.infer<typeof songSchema>;
