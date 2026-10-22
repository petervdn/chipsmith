/**
 * The models a job's Claude can compose with, as Claude Code's `--model` names them (an alias for
 * the latest of each), and the one chosen until another is. Knows nothing of jobs or the page.
 */

/** The models to compose with, the most capable first. */
export const COMPOSER_MODELS = ['opus', 'sonnet', 'haiku'] as const;

/** A model to compose with. */
export type ComposerModel = (typeof COMPOSER_MODELS)[number];

/** The model chosen until another is. */
export const DEFAULT_COMPOSER_MODEL: ComposerModel = 'opus';

/** Each model's name as the page shows it, and what to expect of it. */
export const COMPOSER_MODEL_FACTS = {
  opus: { name: 'Opus', about: 'the most capable, and the slowest' },
  sonnet: { name: 'Sonnet', about: 'faster than Opus, less capable' },
  haiku: { name: 'Haiku', about: 'the fastest, the least capable' },
} satisfies Record<ComposerModel, { name: string; about: string }>;
