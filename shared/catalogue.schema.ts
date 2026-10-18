/** What songs and clips share for keeping track of them: a status and tags (docs/adr/0009). */
import { z } from 'zod';

/** Where a song or a clip stands: new until heard, then kept or not. One not wanted is deleted. */
export const statusSchema = z.enum(['new', 'heard', 'keeper']);

/** Where a song or a clip stands. */
export type Status = z.infer<typeof statusSchema>;

/** A word that describes a song or a clip, and who gave it: Claude when it made it, or the user. */
export const tagSchema = z.object({ name: z.string(), by: z.enum(['claude', 'user']) });

/** A word that describes a song or a clip, and who gave it. */
export type Tag = z.infer<typeof tagSchema>;
