/**
 * The titles of the songs a job makes: how many words each is asked to have, chosen at random so
 * every length is as likely as another, and the titles a script gives that another song has
 * already. Knows nothing of the job runner or of the check that reports them.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** The fewest and most words a title is asked to have. */
const FEWEST_TITLE_WORDS = 2;
const MOST_TITLE_WORDS = 6;

/**
 * Returns how many words each song's title is asked to have, each from 2 to 6, all equally likely.
 *
 * @param songCount - How many songs the job makes.
 * @param random - Gives a number from 0 up to 1; Math.random unless a test gives its own.
 * @returns A word count per song, in order.
 */
export function getTitleWordCounts(
  songCount: number,
  random: () => number = Math.random,
): number[] {
  const choices = MOST_TITLE_WORDS - FEWEST_TITLE_WORDS + 1;
  return Array.from(
    { length: songCount },
    () => FEWEST_TITLE_WORDS + Math.floor(random() * choices),
  );
}

/**
 * Returns the titles of the songs in a data folder.
 *
 * @param songsFolder - The data folder's songs/, a folder per song with its song.json.
 * @returns Every title found; a song.json that does not read, or has no title, gives none.
 */
export function readSongTitles(songsFolder: string): string[] {
  if (!existsSync(songsFolder)) return [];
  return readdirSync(songsFolder).flatMap((songId) => {
    const file = join(songsFolder, songId, 'song.json');
    if (!existsSync(file)) return [];
    try {
      const song: unknown = JSON.parse(readFileSync(file, 'utf8'));
      const title =
        typeof song === 'object' && song !== null && 'title' in song ? song.title : null;
      return typeof title === 'string' ? [title] : [];
    } catch {
      return [];
    }
  });
}

/**
 * Returns the titles of a script's songs that are taken: by a song made before, or by another song
 * of the same script. Titles are the same when they are alike but for case and spaces.
 *
 * @param titles - The titles the script gives, in order.
 * @param takenTitles - The titles of the songs made before.
 * @returns Each title taken, once, with what took it.
 */
export function getTakenTitles(titles: string[], takenTitles: string[]): string[] {
  const madeBefore = new Set(takenTitles.map(getTitleKey));
  const seen = new Set<string>();
  const taken: string[] = [];
  for (const title of titles) {
    const key = getTitleKey(title);
    if (madeBefore.has(key)) taken.push(`"${title}" is the title of a song made before`);
    else if (seen.has(key)) taken.push(`"${title}" is the title of another song of this script`);
    seen.add(key);
  }
  return [...new Set(taken)];
}

/**
 * Returns a title as titles are compared: lower case, its spaces made single.
 *
 * @param title - The title.
 * @returns The title to compare.
 */
function getTitleKey(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLowerCase();
}
