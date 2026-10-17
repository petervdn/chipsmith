/**
 * The two looks, light and dark, in the order the top bar's ‹ › steps through them; style.css holds
 * their colours under `data-look`. Knows nothing of the page.
 */

/** A look: its id (style.css's `data-look`) and the name the top bar shows. */
export type Look = { id: string; name: string };

/** The light look, and the one an unknown id falls back to. */
export const DEFAULT_LOOK: Look = { id: 'light', name: 'Light' };

/** Every look, in order. */
export const LOOKS: Look[] = [DEFAULT_LOOK, { id: 'dark', name: 'Dark' }];

/** The look of an id, or the default one if there is none. */
export function getLook(lookId: string): Look {
  return LOOKS.find((look) => look.id === lookId) ?? DEFAULT_LOOK;
}

/** The look `step` places on from `lookId`, round from the last to the first. */
export function getNextLook({ lookId, step }: { lookId: string; step: number }): Look {
  const index = LOOKS.findIndex((look) => look.id === lookId);
  const next = (((index + step) % LOOKS.length) + LOOKS.length) % LOOKS.length;
  return LOOKS[next] ?? DEFAULT_LOOK;
}
