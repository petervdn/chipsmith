/**
 * A song's structure: the sections it is made of, in order, as a prompt asks for them. A section is a
 * part by its letter (A, B, C…), and a variant of it (0 the part itself, 1 its first variation A′, 2
 * the second A″); the same letter and variant again is that section repeated (in other bars, a
 * variation of it). A structure can be saved and named (structures/<id>/structure.json), and what
 * was sent with a prompt is copied into the job and the songs it made.
 */

/** A section of a song. */
export type Section = {
  /** The part, A to Z. */
  letter: string;
  /** 0 for the part itself, 1 for its first variation (A′), 2 for the second (A″). */
  variant: number;
  bars: number;
  /** What the section is in the song (intro, chorus, breakdown…), or null. */
  role: string | null;
  /** How intense it is, 1 (calm) to 5 (most), or null. */
  energy: number | null;
  /** Anything more asked of it, or an empty string. */
  note: string;
  /**
   * How the section before leads into it (shared/lead-ins.ts values), played at the end of that
   * section; none for Claude's choice. The first section's is not used.
   */
  leadIn: string[];
};

/** How a section stands to those before it: a new part, a variation of one, or one again. */
export type SectionRelation = 'new' | 'variation' | 'repeat';

/** A structure as structures/<id>/structure.json holds it. */
export type Structure = {
  id: string;
  name: string;
  sections: Section[];
  created: string;
  updated: string;
};

/** What a structure is made or changed with. */
export type StructureDraft = { name: string; sections: Section[] };

/** A structure as it was sent with a prompt, copied: saved, a preset, or written for the prompt alone. */
export type SentStructure = { name: string; sections: Section[] };
