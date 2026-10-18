/**
 * What a request to the server sends in its body, as a schema each (docs/adr/0038): the server
 * parses a body with it where it comes in, and the page sends what its input type says. A rule that
 * needs the store (the clip changed, the song that plays it) is the route's.
 */
import { z } from 'zod';
import { statusSchema, tagSchema } from './catalogue.schema.ts';
import { channelRowSchema } from './clip-notes.schema.ts';
import { sentHarmonySchema } from './harmony.schema.ts';
import { takesTargetSchema } from './job.schema.ts';
import { trackSchema } from './song.schema.ts';
import { sentStructureSchema } from './structure.schema.ts';

/** The most songs a prompt can ask for. */
export const MOST_SONGS = 6;
/** The most semitones a transpose moves a clip, either way: two octaves. */
const MOST_SEMITONES = 24;

/** A change to a song's or a clip's catalogue fields; a field left out stays as it is. */
export const catalogueChangeSchema = z.object({
  status: statusSchema.exactOptional(),
  tags: z.array(tagSchema).exactOptional(),
});

/** A change to a song's or a clip's catalogue fields. */
export type CatalogueChange = z.infer<typeof catalogueChangeSchema>;

/** A change to a clip's record: its catalogue fields, and a variation's label (docs/adr/0036). */
export const clipChangeSchema = catalogueChangeSchema.extend({
  variationLabel: z.string().trim().min(1, 'is empty').exactOptional(),
});

/** A change to a clip's record. */
export type ClipChange = z.infer<typeof clipChangeSchema>;

/** A song's arrangement, saved from the editor. */
export const tracksChangeSchema = z.object({ tracks: z.array(trackSchema) });

/** A prompt sent as a job: for songs, or for takes of a clip in a song (`takesOf`). */
export const jobRequestSchema = z.object({
  prompt: z.string().trim().min(1, 'is empty'),
  /** The song whose prompt is sent again, or null. */
  fromSong: z.string().nullable().default(null),
  /** The style guides chosen, by id. */
  guideIds: z.array(z.string()).default([]),
  structure: sentStructureSchema.nullable().default(null),
  harmony: sentHarmonySchema.nullable().default(null),
  /** How many songs (or takes) to make, or null to leave it to the prompt. */
  songCount: z.number().int().min(1).max(MOST_SONGS).nullable().default(null),
  takesOf: takesTargetSchema.nullable().default(null),
});

/** A prompt sent as a job, as the page sends it. */
export type JobRequest = z.input<typeof jobRequestSchema>;

/** A take of a clip asked by transposing it, in a song. */
export const transposeRequestSchema = z.object({
  song: z.string(),
  semitones: z
    .number()
    .int()
    .min(-MOST_SEMITONES)
    .max(MOST_SEMITONES)
    .refine((semitones) => semitones !== 0, 'is 0'),
});

/** A take of a clip asked by transposing it. */
export type TransposeRequest = z.input<typeof transposeRequestSchema>;

/** A take of a clip asked from one channel's rows as the note grid edited them. */
export const notesRequestSchema = z.object({
  song: z.string(),
  channel: z.number().int().min(0),
  rows: z.array(channelRowSchema),
});

/** A take of a clip asked from one channel's rows. */
export type NotesRequest = z.input<typeof notesRequestSchema>;

/** A take deleted from the song it is edited in (docs/adr/0039). */
export const takeDeletionRequestSchema = z.object({ song: z.string() });

/** A take deleted from the song it is edited in. */
export type TakeDeletionRequest = z.input<typeof takeDeletionRequestSchema>;

/** A reference's notes, written as the user types. */
export const referenceNotesSchema = z.object({ notes: z.string() });
