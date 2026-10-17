/** What songs and clips share for keeping track of them: a status and tags (docs/adr/0009). */

/** Where a song or a clip stands: new until heard, then kept or not. One not wanted is deleted. */
export type Status = 'new' | 'heard' | 'keeper';

/** A word that describes a song or a clip, and who gave it: Claude when it made it, or the user. */
export type Tag = { name: string; by: 'claude' | 'user' };
