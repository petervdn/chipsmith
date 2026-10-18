/**
 * A style guide: a named text sent along with a prompt when it is chosen (docs/adr/0019). A guide can
 * be edited and deleted; what was sent is copied into the job and the songs it made, so they keep
 * what they were made from.
 */
import { z } from 'zod';

/** What a guide is made or changed with: its name (trimmed, not empty), text and default. */
export const guideDraftSchema = z.object({
  name: z.string().trim().min(1, 'is empty'),
  text: z.string(),
  /** Whether it is chosen already when a prompt is started. */
  isDefault: z.boolean(),
});

/** What a guide is made or changed with. */
export type GuideDraft = z.infer<typeof guideDraftSchema>;

/** A guide as guides/<id>/guide.json holds it. */
export const guideSchema = z.object({
  id: z.string(),
  ...guideDraftSchema.shape,
  created: z.string(),
  updated: z.string(),
});

/** A guide as guides/<id>/guide.json holds it. */
export type Guide = z.infer<typeof guideSchema>;

/** A guide as it was sent with a prompt, copied. */
export const sentGuideSchema = z.object({ id: z.string(), name: z.string(), text: z.string() });

/** A guide as it was sent with a prompt, copied. */
export type SentGuide = z.infer<typeof sentGuideSchema>;
