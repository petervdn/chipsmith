/**
 * A channel of a .fur file as one run of rows, from its first order to its last, for editing its
 * notes (docs/adr/0037's note grid): read out with its notes, instruments and volumes, and written
 * back, every row keeping its effects as they were; or, for a take's script, its whole run of rows
 * read and written with their effects. Written back, the channel gets a pattern of its own at every
 * order (a pattern played at two orders becomes two). Knows nothing of clips.
 */
import type { ChannelRow } from '../shared/clip-notes.schema.ts';
import type { FurFile, Pattern, Row } from './fur.types.ts';

/**
 * Returns the rows of a channel that hold a note, an instrument or a volume, in the order played.
 *
 * @param furFile - The .fur file.
 * @param channel - The channel.
 * @returns The rows, by their place in the channel's run of rows.
 */
export function getChannelRows(furFile: FurFile, channel: number): ChannelRow[] {
  return getChannelRun(furFile, channel).flatMap((row, i) =>
    row && (row.note !== undefined || row.instrument !== undefined || row.volume !== undefined)
      ? [
          {
            row: i,
            note: row.note ?? null,
            instrument: row.instrument ?? null,
            volume: row.volume ?? null,
          },
        ]
      : [],
  );
}

/**
 * Returns how many rows a channel's run has: its orders times the pattern length.
 *
 * @param furFile - The .fur file.
 * @param channel - The channel.
 * @returns The number of rows.
 */
export function getRowCount(furFile: FurFile, channel: number): number {
  return (furFile.song.orders[channel]?.length ?? 0) * furFile.song.patternLength;
}

/**
 * Returns a .fur file with a channel's notes, instruments and volumes set from rows, its effects
 * kept where they were; the channel gets a pattern of its own at every order.
 *
 * @param furFile - The .fur file; it is left as it was.
 * @param channel - The channel.
 * @param rows - The rows that hold a note, an instrument or a volume; any other row has none. A
 *   row past the channel's run is an error.
 * @returns The .fur file with the channel's rows set.
 */
export function setChannelRows(furFile: FurFile, channel: number, rows: ChannelRow[]): FurFile {
  const run = getChannelRun(furFile, channel);
  const byRow = new Map(rows.map((row) => [row.row, row]));
  for (const row of byRow.keys()) {
    if (!Number.isInteger(row) || row < 0 || row >= run.length) {
      throw new Error(`row ${row} is past the channel's ${run.length} rows`);
    }
  }
  return putChannelRun(
    furFile,
    channel,
    run.map((old, i) => getEditedRow(old, byRow.get(i))),
  );
}

/**
 * Returns a .fur file with a channel's whole run of rows replaced, effects and all; the channel gets
 * a pattern of its own at every order.
 *
 * @param furFile - The .fur file; it is left as it was.
 * @param channel - The channel.
 * @param rows - The channel's rows, as many as its run has (`getChannelRun`); others are an error.
 * @returns The .fur file with the channel's rows replaced.
 */
export function setChannelRun(furFile: FurFile, channel: number, rows: (Row | null)[]): FurFile {
  const count = getRowCount(furFile, channel);
  if (rows.length !== count) {
    throw new Error(`channel ${channel} has ${count} rows, not ${rows.length}`);
  }
  return putChannelRun(furFile, channel, rows);
}

/**
 * Returns a .fur file with a channel's run of rows put in, a pattern of its own at every order.
 *
 * @param furFile - The .fur file; it is left as it was.
 * @param channel - The channel.
 * @param rows - The channel's rows, as many as its run has.
 * @returns The .fur file with the channel's rows put in.
 */
function putChannelRun(furFile: FurFile, channel: number, rows: (Row | null)[]): FurFile {
  const { patternLength, orders } = furFile.song;
  const channelOrders = orders[channel] ?? [];
  const patterns: Pattern[] = channelOrders.map((_unused, order) => ({
    channel,
    index: order,
    rows: rows.slice(order * patternLength, (order + 1) * patternLength),
  }));
  return {
    ...furFile,
    song: {
      ...furFile.song,
      orders: orders.map((indexes, i) =>
        i === channel ? indexes.map((_unused, order) => order) : indexes,
      ),
    },
    patterns: [...furFile.patterns.filter((pattern) => pattern.channel !== channel), ...patterns],
  };
}

/**
 * Returns a channel's rows in the order played, effects and all: each order's pattern, a row null
 * where empty.
 *
 * @param furFile - The .fur file.
 * @param channel - The channel.
 * @returns The rows, the pattern length to an order.
 */
export function getChannelRun(furFile: FurFile, channel: number): (Row | null)[] {
  const { patternLength, orders } = furFile.song;
  return (orders[channel] ?? []).flatMap((index) => {
    const pattern = furFile.patterns.find(
      (candidate) => candidate.channel === channel && candidate.index === index,
    );
    return Array.from({ length: patternLength }, (_unused, i) => pattern?.rows[i] ?? null);
  });
}

/**
 * Returns a row with its note, instrument and volume set from an edited row, its effects kept.
 *
 * @param old - The row as it was, or null when empty.
 * @param edited - What the row holds now, or undefined for no note, instrument or volume.
 * @returns The row, or null when nothing is left in it.
 */
function getEditedRow(old: Row | null, edited: ChannelRow | undefined): Row | null {
  const row: Row = {};
  if (edited?.note !== null && edited?.note !== undefined) row.note = edited.note;
  if (edited?.instrument !== null && edited?.instrument !== undefined) {
    row.instrument = edited.instrument;
  }
  if (edited?.volume !== null && edited?.volume !== undefined) row.volume = edited.volume;
  if (old?.effects?.length) row.effects = old.effects;
  return Object.keys(row).length > 0 ? row : null;
}
