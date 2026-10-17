/**
 * A whole .fur file as text, as the tracker shows it: the song's settings, the instruments, and
 * every order's patterns side by side, a column per channel, a line per row. For reading a clip
 * without opening Furnace. Knows nothing of files.
 */
import type { FurFile } from './fur.types.ts';
import { describeInstrument, describeSong, formatRow } from './dump.ts';

/** What sets the channels' columns apart. */
const COLUMN_GAP = ' | ';

/**
 * Returns a .fur file as tracker text.
 *
 * @param furFile - The .fur file read.
 * @param channelNames - Each channel's name, for the columns' heads.
 * @returns The text: the song, the instruments, then each order's rows.
 */
export function getTrackerText(furFile: FurFile, channelNames: string[]): string {
  const { song, instruments, patterns } = furFile;
  const lines = [describeSong(furFile), '', 'Instruments'];
  instruments.forEach((block, i) => lines.push(`${formatHex(i)} ${describeInstrument(block)}`));
  const orderCount = song.orders[0]?.length ?? 0;
  for (let order = 0; order < orderCount; order++) {
    const columns = Array.from({ length: song.channelCount }, (_unused, channel) => {
      const index = song.orders[channel]?.[order];
      const pattern = patterns.find((each) => each.channel === channel && each.index === index);
      const rows = Array.from({ length: song.patternLength }, (_row, i) =>
        formatRow(pattern?.rows[i] ?? null),
      );
      const head = `${channelNames[channel] ?? `Channel ${channel + 1}`} (${index ?? '-'})`;
      const width = Math.max(head.length, ...rows.map((row) => row.length));
      return { head: head.padEnd(width), rows: rows.map((row) => row.padEnd(width)) };
    });
    lines.push(
      '',
      `Order ${formatHex(order)}`,
      `   ${columns.map((column) => column.head).join(COLUMN_GAP)}`.trimEnd(),
    );
    for (let row = 0; row < song.patternLength; row++) {
      const cells = columns.map((column) => column.rows[row] ?? '');
      lines.push(`${formatHex(row)} ${cells.join(COLUMN_GAP)}`.trimEnd());
    }
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Formats a number as two upper case hex digits, as the tracker counts rows and instruments.
 *
 * @param value - The number.
 * @returns The digits.
 */
function formatHex(value: number): string {
  return value.toString(16).toUpperCase().padStart(2, '0');
}
