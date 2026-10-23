/**
 * How hard a job's Claude thinks while it composes, as Claude Code's `--effort` names it; none is
 * Claude Code's own default for the model. Knows nothing of jobs or the page.
 */

/** The efforts to compose with, the least first. */
export const COMPOSER_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

/** An effort to compose with. */
export type ComposerEffort = (typeof COMPOSER_EFFORTS)[number];

/** Each effort's name as the page shows it. */
export const COMPOSER_EFFORT_NAMES = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra high',
  max: 'Max',
} satisfies Record<ComposerEffort, string>;
