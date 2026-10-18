/**
 * A song's structure: the sections it is made of, in order, as a prompt asks for them. A section is a
 * part by its letter (A, B, C…), and a variant of it (0 the part itself, 1 its first variation A′, 2
 * the second A″); the same letter and variant again is that section repeated (in other bars, a
 * variation of it). A structure can be saved and named (structures/<id>/structure.json), and what
 * was sent with a prompt is copied into the job and the songs it made.
 */
import { z } from 'zod';
import { getLeadIn } from './lead-ins.ts';

/** The letters a section can have. */
const LETTERS = /^[A-Z]$/;
/** The most bars a section can have. */
const MOST_BARS = 256;
/** The highest variant of a part. */
const MOST_VARIANT = 9;
/** The highest energy. */
const MOST_ENERGY = 5;

/** A section of a song; what older files leave out is read as none. */
export const sectionSchema = z.object({
  /** The part, A to Z. */
  letter: z.string().regex(LETTERS, 'is not A to Z'),
  /** 0 for the part itself, 1 for its first variation (A′), 2 for the second (A″). */
  variant: z.number().int().min(0).max(MOST_VARIANT),
  bars: z.number().int().min(1).max(MOST_BARS),
  /** What the section is in the song (intro, chorus, breakdown…), or null. */
  role: z.string().nullable().default(null),
  /** How intense it is, 1 (calm) to 5 (most), or null. */
  energy: z.number().int().min(1).max(MOST_ENERGY).nullable().default(null),
  /** Anything more asked of it, or an empty string. */
  note: z.string().default(''),
  /**
   * How the section before leads into it (shared/lead-ins.ts values), played at the end of that
   * section; none for Claude's choice. The first section's is not used.
   */
  leadIn: z
    .array(z.string().refine((value) => getLeadIn(value) !== undefined, 'is not a lead-in'))
    .default([]),
});

/** A section of a song. */
export type Section = z.infer<typeof sectionSchema>;

/** A structure's sections: at least one. */
const sectionsSchema = z.array(sectionSchema).min(1, 'has no sections');

/** How a section stands to those before it: a new part, a variation of one, or one again. */
export type SectionRelation = 'new' | 'variation' | 'repeat';

/** What a structure is made or changed with: its name (trimmed, not empty) and sections. */
export const structureDraftSchema = z.object({
  name: z.string().trim().min(1, 'is empty'),
  sections: sectionsSchema,
});

/** What a structure is made or changed with. */
export type StructureDraft = z.infer<typeof structureDraftSchema>;

/** A structure as structures/<id>/structure.json holds it. */
export const structureSchema = z.object({
  id: z.string(),
  ...structureDraftSchema.shape,
  created: z.string(),
  updated: z.string(),
});

/** A structure as structures/<id>/structure.json holds it. */
export type Structure = z.infer<typeof structureSchema>;

/** A structure as it was sent with a prompt, copied: saved, a preset, or written for the prompt alone. */
export const sentStructureSchema = z.object({ name: z.string(), sections: sectionsSchema });

/** A structure as it was sent with a prompt, copied. */
export type SentStructure = z.infer<typeof sentStructureSchema>;
