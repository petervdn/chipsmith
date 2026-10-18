/**
 * A style guide: a named text sent along with a prompt when it is chosen (docs/adr/0019). A guide can
 * be edited and deleted; what was sent is copied into the job, the songs and the clips it made, so
 * they keep what they were made from.
 */

/** A guide as guides/<id>/guide.json holds it. */
export type Guide = {
  id: string;
  name: string;
  text: string;
  /** Whether it is chosen already when a prompt is started. */
  isDefault: boolean;
  created: string;
  updated: string;
};

/** A guide as it was sent with a prompt, copied. */
export type SentGuide = { id: string; name: string; text: string };

/** What a guide is made or changed with. */
export type GuideDraft = { name: string; text: string; isDefault: boolean };
