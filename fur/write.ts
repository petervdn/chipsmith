/**
 * Writing a .fur file: the header, the INFO block, a FLAG block per chip, three ADIR blocks, the
 * instruments, wavetables and patterns, laid out as Furnace itself writes them (checked against
 * references/furnace/demos/nes). The pointers in INFO are found by laying the file out twice.
 */
import { deflateSync } from 'node:zlib';
import { FORMAT_VERSION, makeBlock } from './block.ts';
import { ByteWriter } from './bytes.ts';
import type { FurFile, FurSong } from './fur.types.ts';
import { makePattern } from './pattern.ts';

/** The compatibility flags of a new 0.6.8 song, taken from a version 223 demo. */
const COMPAT_FIRST = [0, 2, 2, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1];
const COMPAT_SECOND = [
  0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 4, 0, 0, 1, 1, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0,
];
const COMPAT_THIRD = [0, 0, 0, 1, 0, 0, 1, 1];
/** The slots INFO has for chips. */
const CHIP_SLOTS = 32;
/** The header's length: magic, version, reserved, INFO's pointer, reserved. */
const HEADER_LENGTH = 32;
/** The size of a groove's speed list in INFO. */
const SPEED_SLOTS = 16;
/** What a channel shows in the tracker: 3 is its pattern and its oscilloscope. */
const SHOWN = 3;
const DEFAULT_SPEED = 6;
const TUNING = 440;

/** Where each kind of block starts in the file; 0 for a block that is not there. */
type Pointers = {
  flags: number[];
  instruments: number[];
  wavetables: number[];
  patterns: number[];
  directories: number[];
};

/**
 * Lays out a .fur file's bytes, not yet compressed. Throws if the layout does not add up.
 *
 * @param furFile - The .fur file to write.
 * @param furFile.song - The song's settings, written in INFO and a FLAG block per chip.
 * @param furFile.instruments - The instrument blocks, as they are.
 * @param furFile.wavetables - The wavetable blocks, as they are.
 * @param furFile.patterns - The patterns, written by channel and then by number.
 * @returns The file's uncompressed bytes.
 */
export function getUncompressedFurBytes({
  song,
  instruments,
  wavetables,
  patterns,
}: FurFile): Uint8Array {
  const flagBlocks = song.chipFlags.map((flags) =>
    flags === null
      ? new Uint8Array()
      : makeBlock('FLAG', new ByteWriter().cString(flags).getBytes()),
  );
  const directoryBlocks = [
    makeDirectory(instruments.length),
    wavetables.length > 0 ? makeDirectory(wavetables.length) : makeEmptyDirectory(),
    makeEmptyDirectory(),
  ];
  const patternBlocks = [...patterns]
    .sort((first, second) => first.channel - second.channel || first.index - second.index)
    .map(({ channel, index, rows }) => makePattern(channel, index, rows));
  const groups = [flagBlocks, directoryBlocks, instruments, wavetables, patternBlocks];
  const blank: Pointers = {
    flags: flagBlocks.map(() => 0),
    instruments: instruments.map(() => 0),
    wavetables: wavetables.map(() => 0),
    patterns: patternBlocks.map(() => 0),
    directories: [0, 0, 0],
  };
  let position = HEADER_LENGTH + makeInfo(song, blank).length;
  const [flags, directories, instrumentPointers, wavetablePointers, patternPointers] = groups.map(
    (blocks) =>
      blocks.map((block) => {
        const pointer = block.length > 0 ? position : 0;
        position += block.length;
        return pointer;
      }),
  );
  const info = makeInfo(song, {
    flags: flags ?? [],
    directories: directories ?? [],
    instruments: instrumentPointers ?? [],
    wavetables: wavetablePointers ?? [],
    patterns: patternPointers ?? [],
  });
  const file = new ByteWriter()
    .ascii('-Furnace module-')
    .u16(FORMAT_VERSION)
    .u16(0)
    .u32(HEADER_LENGTH)
    .fill(0, 8)
    .add(info);
  for (const block of groups.flat()) file.add(block);
  const bytes = file.getBytes();
  if (bytes.length !== position) throw new Error('the layout of the .fur file does not add up');
  return bytes;
}

/**
 * Returns a .fur file's bytes, compressed as Furnace writes them.
 *
 * @param furFile - The .fur file to write.
 * @returns The file's compressed bytes.
 */
export function getFurFileBytes(furFile: FurFile): Uint8Array {
  return deflateSync(getUncompressedFurBytes(furFile));
}

function makeDirectory(count: number): Uint8Array {
  const body = new ByteWriter().u32(1).u8(0).u16(count);
  for (let i = 0; i < count; i++) body.u8(i);
  return makeBlock('ADIR', body.getBytes());
}

function makeEmptyDirectory(): Uint8Array {
  return makeBlock('ADIR', new ByteWriter().u32(0).getBytes());
}

function makeInfo(song: FurSong, pointers: Pointers): Uint8Array {
  const { channelCount, chips, speeds } = song;
  const info = new ByteWriter()
    .add([0, speeds[0] ?? DEFAULT_SPEED, speeds.at(-1) ?? DEFAULT_SPEED, 1])
    .f32(song.tickRate)
    .u16(song.patternLength)
    .u16(song.orders[0]?.length ?? 0)
    .u8(song.highlights.first)
    .u8(song.highlights.second)
    .u16(pointers.instruments.length)
    .u16(pointers.wavetables.length)
    .u16(0)
    .u32(pointers.patterns.length)
    .add(chips)
    .fill(0, CHIP_SLOTS - chips.length)
    .fill(0x40, CHIP_SLOTS)
    .fill(0, CHIP_SLOTS);
  for (let i = 0; i < CHIP_SLOTS; i++) info.u32(pointers.flags[i] ?? 0);
  info.cString(song.name).cString(song.author).f32(TUNING).add(COMPAT_FIRST);
  for (const pointer of pointers.instruments) info.u32(pointer);
  for (const pointer of pointers.wavetables) info.u32(pointer);
  for (const pointer of pointers.patterns) info.u32(pointer);
  for (const orders of song.orders) info.add(orders);
  info.add(song.effectColumns).fill(SHOWN, channelCount).fill(0, channelCount);
  info.fill(0, channelCount).fill(0, channelCount);
  info.cString(song.comment).f32(1).add(COMPAT_SECOND);
  info.u16(song.virtualTempo.numerator).u16(song.virtualTempo.denominator);
  info.fill(0, 2).fill(0, 4);
  info.cString(song.systemName).fill(0, 5);
  for (const volume of song.chipVolumes) info.f32(volume).f32(0).f32(0);
  const connections = getConnections(chips.length);
  info.u32(connections.length);
  for (const connection of connections) info.u32(connection);
  info.u8(1).add(COMPAT_THIRD);
  info
    .u8(speeds.length)
    .add(speeds)
    .fill(DEFAULT_SPEED, SPEED_SLOTS - speeds.length);
  info.u8(0);
  for (const pointer of pointers.directories) info.u32(pointer);
  return makeBlock('INFO', info.getBytes());
}

/**
 * Returns the patchbay: each chip's outputs 0 and 1 to the system's 0 and 1. Furnace builds it
 * again anyway, as the automatic patchbay is on.
 *
 * @param chipCount - How many chips the song has.
 * @returns The connections, one number each, as INFO stores them.
 */
function getConnections(chipCount: number): number[] {
  if (chipCount === 1) return [0x00000000, 0x00000001];
  const connections: number[] = [];
  for (let chip = 0; chip < chipCount; chip++) {
    for (const port of [0, 1]) connections.push(((chip << 20) | (port << 16) | port) >>> 0);
  }
  return connections;
}
