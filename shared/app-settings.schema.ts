/**
 * The app's settings: choices that hold for every prompt and every browser, kept in the data folder
 * (settings.json): the model that composes and its effort. What the file leaves out is read as its default.
 */
import { z } from 'zod';
import { COMPOSER_EFFORTS } from './composer-efforts.ts';
import { COMPOSER_MODELS, DEFAULT_COMPOSER_MODEL } from './composer-models.ts';

/** The app's settings, as settings.json holds them. */
export const appSettingsSchema = z.object({
  /** The model Claude composes every job with, songs and takes. */
  composerModel: z.enum(COMPOSER_MODELS).default(DEFAULT_COMPOSER_MODEL),
  /** How hard it thinks while composing; null for Claude Code's own default. */
  composerEffort: z.enum(COMPOSER_EFFORTS).nullable().default(null),
});

/** The app's settings. */
export type AppSettings = z.infer<typeof appSettingsSchema>;
