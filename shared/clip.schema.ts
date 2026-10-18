/**
 * A clip: one piece of audio in the shared pool, the whole of a piece or a slice of it by bars and
 * chip channels. A clip holds all of its own information, even what other clips repeat
 * (docs/adr/0004): its record, and what its source says, read from it (docs/adr/0024). Its audio and
 * source never change once made (docs/adr/0005).
 */
import { z } from 'zod';
import { statusSchema, tagSchema } from './catalogue.schema.ts';

/** The bars a clip covers, from the first to the one after the last; null in a Clip is the whole piece. */
export const barRangeSchema = z.object({ from: z.number(), to: z.number() });

/** The bars a clip covers. */
export type BarRange = z.infer<typeof barRangeSchema>;

/** How a clip came from its parent: a change to it (a take), or cut out of it. */
export const clipRelationSchema = z.enum(['variation', 'split']);

/** How a clip came from its parent. */
export type ClipRelation = z.infer<typeof clipRelationSchema>;

/** The clip a clip was made from. */
export const clipParentSchema = z.object({ clip: z.string(), relation: clipRelationSchema });

/** The clip a clip was made from. */
export type ClipParent = z.infer<typeof clipParentSchema>;

/** What a clip is called in the music: its section (A, B…) and its stem (Bass, Lead…); null when whole. */
export const clipNameSchema = z.object({
  section: z.string().nullable(),
  stem: z.string().nullable(),
});

/** What a clip is called in the music. */
export type ClipName = z.infer<typeof clipNameSchema>;

/**
 * A clip as its clip.json holds it: what only the clip's record can say. Why it was made is not
 * kept: the song keeps its prompt (docs/adr/0036). What its source.fur says is read from it, never
 * stored (ClipFacts, docs/adr/0024). A variation has a label, and no other clip has one.
 */
export const clipRecordSchema = z
  .object({
    id: z.string(),
    created: z.string(),
    name: clipNameSchema,
    bars: barRangeSchema.nullable(),
    parent: clipParentSchema.nullable(),
    /**
     * What a variation changed from its parent ("walking bass", "octave up"), to tell it from the
     * other takes; written when it is made and editable. Null when the clip is not a variation
     * (docs/adr/0036).
     */
    variationLabel: z.string().trim().nullable(),
    /** The song the clip was made in; for information, nothing depends on it. */
    madeFor: z.string().nullable(),
    tags: z.array(tagSchema),
    status: statusSchema,
    key: z.string().nullable(),
    /** The Furnace version its audio was rendered with; null until it is rendered. */
    furnace: z.string().nullable(),
  })
  .superRefine(({ parent, variationLabel }, context) => {
    const isVariation = parent?.relation === 'variation';
    if (isVariation && !variationLabel) {
      context.addIssue({
        code: 'custom',
        path: ['variationLabel'],
        message: 'is empty, and a variation needs one',
      });
    }
    if (!isVariation && variationLabel !== null) {
      context.addIssue({
        code: 'custom',
        path: ['variationLabel'],
        message: 'is set, but the clip is not a variation',
      });
    }
  });

/** A clip as its clip.json holds it. */
export type ClipRecord = z.infer<typeof clipRecordSchema>;

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
