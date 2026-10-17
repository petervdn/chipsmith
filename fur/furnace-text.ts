/**
 * What Furnace's own text export of a .fur says of it (`Furnace -txtout`): its name, author and
 * album, its chips, how many channels its first subsong has and how many subsongs there are. Any
 * .fur Furnace reads, not only those this project writes. Knows nothing of files.
 */

/** What a .fur says of itself, read from its text export. */
export type FurnaceTextFacts = {
  name: string;
  author: string;
  album: string;
  /** The chips, by Furnace's names, in the order their channels come. */
  chips: string[];
  /** The channels of its first subsong: the columns of its orders. */
  channelCount: number;
  subsongCount: number;
};

/**
 * Reads the facts of a .fur from its text export.
 *
 * @param text - The text export.
 * @returns Its facts; a field the text does not give is empty, a count 0.
 */
export function readFurnaceText(text: string): FurnaceTextFacts {
  const chipsSection = getSection(text, 'Sound Chips');
  const subsongsSection = getSection(text, 'Subsongs');
  return {
    name: getInformation(text, 'name'),
    author: getInformation(text, 'author'),
    album: getInformation(text, 'album'),
    chips: chipsSection
      .split('\n')
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2).trim()),
    channelCount: getChannelCount(subsongsSection),
    subsongCount: subsongsSection.split('\n').filter((line) => /^## \d+:/.test(line)).length,
  };
}

/**
 * Returns a section of the text export: the lines under a `# ` heading, up to the next.
 *
 * @param text - The text export.
 * @param heading - The heading's words.
 * @returns The section's lines, or an empty string when there is none.
 */
function getSection(text: string, heading: string): string {
  const start = text.indexOf(`\n# ${heading}\n`);
  if (start === -1) return '';
  const body = text.slice(start + heading.length + 4);
  const end = body.search(/^# /m);
  return end === -1 ? body : body.slice(0, end);
}

/**
 * Returns a line of the song's information (`- name: …`).
 *
 * @param text - The text export.
 * @param field - The field's name.
 * @returns Its value, or an empty string.
 */
function getInformation(text: string, field: string): string {
  const line = getSection(text, 'Song Information')
    .split('\n')
    .find((candidate) => candidate.startsWith(`- ${field}: `));
  return line ? line.slice(field.length + 4).trim() : '';
}

/**
 * Returns how many channels the first subsong has: the patterns on the first line of its orders.
 *
 * @param subsongs - The Subsongs section.
 * @returns The count, or 0 when it has no orders.
 */
function getChannelCount(subsongs: string): number {
  const orders = /orders:\n```\n([^\n]*)/.exec(subsongs)?.[1] ?? '';
  const patterns = orders.split('|')[1] ?? '';
  return patterns.split(/\s+/).filter(Boolean).length;
}
