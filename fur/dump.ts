/**
 * A .fur file as text, to see what is in it: the song's settings, the instruments' macros, and a
 * channel's pattern at an order as the tracker shows it.
 * Run: `node fur/dump.ts file.fur [--ins] [--pat CHANNEL[,ORDER]]`.
 */
import { readFileSync } from 'node:fs';
import { ByteReader } from './bytes.ts';
import { ARP_FIXED } from './instrument.ts';
import type { FurFile, Row } from './fur.types.ts';
import { getNoteName } from './notes.ts';
import { readFurFile } from './read.ts';

const MACRO_NAMES = new Map([
  [0, 'vol'],
  [1, 'arp'],
  [2, 'duty'],
  [3, 'wave'],
  [4, 'pitch'],
  [5, 'ex1'],
  [6, 'ex2'],
  [7, 'ex3'],
  [12, 'panL'],
  [13, 'panR'],
  [14, 'phaseReset'],
]);
/** The byte size of a macro value, by the top two bits of its flags. */
const VALUE_SIZES = [1, 1, 2, 4];

/**
 * Formats a byte as two upper-case hex digits.
 *
 * @param value - The byte, or null or undefined when there is none.
 * @returns The two digits, or ".." when there is no byte.
 */
function formatHex(value: number | null | undefined): string {
  return value === null || value === undefined
    ? '..'
    : value.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Formats a pattern row as the tracker shows it: "D-3 00 0F 1202".
 *
 * @param row - The row, or null for an empty one.
 * @returns The note, instrument, volume and effects; "... .. .." for an empty row.
 */
export function formatRow(row: Row | null): string {
  if (!row) return '... .. ..';
  const note = row.note === undefined ? '...' : getNoteName(row.note);
  const effects = (row.effects ?? []).map(
    ({ code, value }) => ` ${formatHex(code)}${formatHex(value)}`,
  );
  return `${note} ${formatHex(row.instrument)} ${formatHex(row.volume)}${effects.join('')}`;
}

/**
 * Describes an instrument block's type, name and macros as text.
 *
 * @param block - The instrument's INS2 block, with its id and length.
 * @returns The name, the type and each macro's values, two spaces apart.
 */
export function describeInstrument(block: Uint8Array): string {
  const reader = new ByteReader(block, 8);
  reader.u16();
  const type = reader.u16();
  const parts: string[] = [`type ${type}`];
  while (reader.position < block.length) {
    const feature = reader.ascii(2);
    if (feature === 'EN') break;
    const length = reader.u16();
    const end = reader.position + length;
    if (feature === 'NA') parts.unshift(`"${reader.cString()}"`);
    if (feature === 'MA') parts.push(...describeMacros(reader, end));
    reader.position = end;
  }
  return parts.join('  ');
}

/**
 * Describes the song's settings and the .fur file's counts as text.
 *
 * @param furFile - The .fur file read.
 * @param furFile.song - The song's settings: name, author, system, chips, speeds, tempo, orders.
 * @param furFile.instruments - The instrument blocks, counted.
 * @param furFile.wavetables - The wavetable blocks, counted.
 * @param furFile.patterns - The patterns, counted.
 * @returns Three lines: the name and chips, the timing, and the counts.
 */
export function describeSong({ song, instruments, wavetables, patterns }: FurFile): string {
  const chips = song.chips.map((chip) => `0x${chip.toString(16)}`).join(', ');
  return [
    `"${song.name}" by ${song.author || '?'} on ${song.systemName} (chips ${chips})`,
    `${song.channelCount} channels, ${song.tickRate} Hz, speeds ${song.speeds.join(' ')}, ` +
      `virtual tempo ${song.virtualTempo.numerator}/${song.virtualTempo.denominator}`,
    `${song.orders[0]?.length ?? 0} orders of ${song.patternLength} rows, ` +
      `${instruments.length} instruments, ${wavetables.length} wavetables, ${patterns.length} patterns`,
  ].join('\n');
}

function describeMacros(reader: ByteReader, end: number): string[] {
  const headerSize = reader.u16();
  const macros: string[] = [];
  while (reader.position < end) {
    const start = reader.position;
    const code = reader.u8();
    if (code === 0xff) break;
    const [length = 0, loop = 0, release = 0, , flags = 0, , speed = 0] = reader.take(7);
    reader.position = start + headerSize;
    const size = VALUE_SIZES[flags >> 6] ?? 1;
    const values = Array.from({ length }, () =>
      size === 4
        ? reader.i32()
        : size === 2
          ? reader.i16()
          : flags >> 6 === 1
            ? reader.i8()
            : reader.u8(),
    );
    const marks = [
      loop !== 255 && `loop ${loop}`,
      release !== 255 && `rel ${release}`,
      speed !== 1 && `speed ${speed}`,
    ];
    const extra = marks.filter(Boolean).join(', ');
    const shown = values.map((value) =>
      value >= ARP_FIXED ? `@${value - ARP_FIXED}` : `${value}`,
    );
    macros.push(
      `${MACRO_NAMES.get(code) ?? code}=[${shown.join(' ')}]${extra ? ` (${extra})` : ''}`,
    );
  }
  return macros;
}

function printDump(args: string[]): void {
  const [file, ...options] = args;
  if (!file) throw new Error('usage: node fur/dump.ts file.fur [--ins] [--pat CHANNEL[,ORDER]]');
  const furFile = readFurFile(readFileSync(file));
  console.log(describeSong(furFile));
  if (options.includes('--ins')) {
    furFile.instruments.forEach((block, i) =>
      console.log(`${i.toString(16).padStart(2, '0')} ${describeInstrument(block)}`),
    );
  }
  const patternOption = options[options.indexOf('--pat') + 1];
  if (options.includes('--pat') && patternOption) {
    const [channel = 0, order = 0] = patternOption.split(',').map(Number);
    const index = furFile.song.orders[channel]?.[order];
    const pattern = furFile.patterns.find(
      (each) => each.channel === channel && each.index === index,
    );
    console.log(`channel ${channel}, order ${order}: pattern ${index}`);
    pattern?.rows.forEach((row, i) =>
      console.log(`${i.toString(16).toUpperCase().padStart(2, '0')}  ${formatRow(row)}`),
    );
  }
}

if (import.meta.main) printDump(process.argv.slice(2));
