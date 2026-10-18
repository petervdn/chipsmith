/**
 * The prompt on a selected block's clip (docs/adr/0037): the quick asks a tap adds to it, how a tap
 * adds one, and the most takes it can ask for. Given text, gives text; knows nothing of the page.
 */

/** The asks a tap adds to the prompt, the ones most often wanted. */
export const QUICK_ASKS = [
  'another take',
  'busier',
  'simpler',
  'more rhythmic',
  'a fill at the end',
  'an octave higher',
];

/** The most takes one prompt asks for. */
export const MOST_TAKES = 5;

/**
 * Returns the prompt with an ask added: the ask alone in an empty prompt, else after a comma.
 *
 * @param text - The prompt as written.
 * @param ask - The ask to add.
 * @returns The prompt with the ask at its end.
 */
export function addAsk(text: string, ask: string): string {
  const written = text.trimEnd();
  if (!written) return ask;
  return /[,.;:!?]$/.test(written) ? `${written} ${ask}` : `${written}, ${ask}`;
}
