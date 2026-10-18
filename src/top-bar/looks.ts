/**
 * The looks, light, the light greys and dark, in the order the top bar's switch goes through them;
 * style.css holds their colours under `data-look`. Knows nothing of the page.
 */

/** A look: its id (style.css's `data-look`) and the name the top bar shows. */
export type Look = { id: string; name: string };

/** The light look, and the one an unknown id falls back to. */
export const DEFAULT_LOOK: Look = { id: 'light', name: 'Light' };

/** Every look, in order. */
export const LOOKS: Look[] = [
  DEFAULT_LOOK,
  { id: 'mist', name: 'Mist' },
  { id: 'fog', name: 'Fog' },
  { id: 'slate', name: 'Slate' },
  { id: 'ash', name: 'Ash' },
  { id: 'dark', name: 'Dark' },
];

/**
 * Returns the look of an id.
 *
 * @param lookId - The look's id, as kept in the preferences.
 * @returns The look, or the default one when no look has that id.
 */
export function getLook(lookId: string): Look {
  return LOOKS.find((look) => look.id === lookId) ?? DEFAULT_LOOK;
}

/**
 * Returns the look a number of places on from another, going round from the last to the first.
 *
 * @param move - The look to start from and how far to go.
 * @param move.lookId - The id of the look to start from.
 * @param move.step - How many places on to go; a negative step goes back.
 * @returns The look that many places on.
 */
export function getNextLook({ lookId, step }: { lookId: string; step: number }): Look {
  const index = LOOKS.findIndex((look) => look.id === lookId);
  const next = (((index + step) % LOOKS.length) + LOOKS.length) % LOOKS.length;
  return LOOKS[next] ?? DEFAULT_LOOK;
}
