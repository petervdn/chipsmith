/**
 * The lead-ins a prompt can ask for between two sections: how the music leads from one into the
 * next, by drums, bass, harmony, lead and all of them together. Each with how the page shows it and
 * how a prompt asks for it. Knows nothing of files or the page.
 */

/** What plays a lead-in. */
export type LeadInGroup = 'drums' | 'bass' | 'harmony' | 'lead' | 'overall';

/** A lead-in: its value, what plays it, how the page shows it, and how a prompt asks for it. */
export type LeadIn = { value: string; group: LeadInGroup; label: string; ask: string };

/** The groups, in the order the page shows them, with their labels. */
export const LEAD_IN_GROUPS: { group: LeadInGroup; label: string }[] = [
  { group: 'drums', label: 'Drums' },
  { group: 'bass', label: 'Bass' },
  { group: 'harmony', label: 'Harmony' },
  { group: 'lead', label: 'Lead' },
  { group: 'overall', label: 'Overall' },
];

/** The lead-ins, by group. */
export const LEAD_INS: LeadIn[] = [
  { value: 'short-fill', group: 'drums', label: 'short fill', ask: 'a short drum fill (a beat)' },
  { value: 'bar-fill', group: 'drums', label: 'bar fill', ask: 'a full-bar drum fill' },
  {
    value: 'roll-down',
    group: 'drums',
    label: 'roll down',
    ask: 'a snare or tom roll moving down',
  },
  { value: 'hit-gap', group: 'drums', label: 'hit, then gap', ask: 'a drum hit, then a gap' },
  { value: 'drums-out', group: 'drums', label: 'drop out', ask: 'the drums dropping out' },
  {
    value: 'walk-in',
    group: 'bass',
    label: 'walk in',
    ask: "the bass walking into the new section's root",
  },
  { value: 'octave-jump', group: 'bass', label: 'octave jump', ask: 'the bass jumping an octave' },
  { value: 'bass-hold', group: 'bass', label: 'hold', ask: 'the bass holding one note' },
  {
    value: 'passing-chord',
    group: 'harmony',
    label: 'passing chord',
    ask: "a passing chord leading in (the new chord's dominant, or a chord a semitone away)",
  },
  {
    value: 'lift',
    group: 'harmony',
    label: 'lift (borrowed)',
    ask: 'a chord borrowed from the parallel major or minor lifting into it (modal interchange)',
  },
  {
    value: 'hang',
    group: 'harmony',
    label: 'hang on V',
    ask: 'the section before ending open on the dominant',
  },
  {
    value: 'soft-landing',
    group: 'harmony',
    label: 'soft landing',
    ask: 'a gentle plagal landing (IV–I)',
  },
  {
    value: 'surprise',
    group: 'harmony',
    label: 'surprise',
    ask: 'a deceptive turn: an unexpected chord where the tonic was due',
  },
  { value: 'step-up', group: 'harmony', label: 'step up a key', ask: 'the new section a step up' },
  {
    value: 'pickup',
    group: 'lead',
    label: 'pickup',
    ask: 'the lead starting its phrase a beat or two early',
  },
  { value: 'lead-rest', group: 'lead', label: 'rest', ask: 'the lead resting for the last bar' },
  { value: 'run-up', group: 'lead', label: 'run up', ask: 'a quick run up into the first note' },
  { value: 'build', group: 'overall', label: 'build', ask: 'a build: denser and rising' },
  { value: 'thin', group: 'overall', label: 'thin out', ask: 'thinning out: layers dropping away' },
  {
    value: 'all-hit',
    group: 'overall',
    label: 'all hit together',
    ask: 'every voice landing together on the first beat',
  },
];

/**
 * Returns a lead-in by its value.
 *
 * @param value - The lead-in's value.
 * @returns The lead-in, or undefined for a value that is not one.
 */
export function getLeadIn(value: string): LeadIn | undefined {
  return LEAD_INS.find((leadIn) => leadIn.value === value);
}
