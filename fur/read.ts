/**
 * Reading a .fur written by this project back into a FurFile, so that writing it again gives the
 * same bytes. Instruments and wavetables are kept as their blocks. Only the old INFO layout with one
 * subsong and the NES, SCC and SCC+ chips is read: what fur/write.ts writes.
 */
import { inflateSync } from 'node:zlib';
import { ByteReader } from './bytes.ts';
import type { FurFile, FurSong, Pattern } from './fur.types.ts';
import { unpackRows } from './pattern.ts';

/** Channels of each chip this project uses, by Furnace's chip id. */
const CHANNELS_OF_CHIP = new Map([
  [0x06, 5], // NES
  [0xb4, 5], // SCC+
  [0xa1, 5], // SCC
]);
const MAGIC = '-Furnace module-';

/** A .fur file's bytes, uncompressed if they were compressed. */
export function getUncompressed(file: Uint8Array): Uint8Array {
  const start = String.fromCharCode(...file.subarray(0, MAGIC.length));
  return start === MAGIC ? file : new Uint8Array(inflateSync(file));
}

/** A .fur file read from its bytes. */
export function readFurFile(file: Uint8Array): FurFile {
  const bytes = getUncompressed(file);
  const reader = new ByteReader(bytes, MAGIC.length);
  reader.u16();
  reader.u16();
  reader.position = reader.u32();
  if (reader.ascii(4) !== 'INFO') throw new Error('only the old INFO layout is read');
  reader.u32();
  reader.u8();
  const firstSpeed = reader.u8();
  reader.u8();
  reader.u8();
  const tickRate = reader.f32();
  const patternLength = reader.u16();
  const orderLength = reader.u16();
  const highlights = { first: reader.u8(), second: reader.u8() };
  const instrumentCount = reader.u16();
  const wavetableCount = reader.u16();
  const sampleCount = reader.u16();
  const patternCount = reader.u32();
  const chips = [...reader.take(32)].filter((chip) => chip !== 0);
  reader.take(64);
  const flagPointers = Array.from({ length: 32 }, () => reader.u32());
  const name = reader.cString();
  const author = reader.cString();
  reader.f32();
  reader.take(20);
  const instrumentPointers = Array.from({ length: instrumentCount }, () => reader.u32());
  const wavetablePointers = Array.from({ length: wavetableCount }, () => reader.u32());
  Array.from({ length: sampleCount }, () => reader.u32());
  const patternPointers = Array.from({ length: patternCount }, () => reader.u32());
  const channelCount = chips.reduce((sum, chip) => sum + getChannelsOfChip(chip), 0);
  const chipFlags = flagPointers
    .slice(0, chips.length)
    .map((pointer) => (pointer ? new ByteReader(bytes, pointer + 8).cString() : null));
  const orders = Array.from({ length: channelCount }, () => [...reader.take(orderLength)]);
  const effectColumns = [...reader.take(channelCount)];
  reader.take(channelCount * 2);
  for (let i = 0; i < channelCount * 2; i++) reader.cString();
  const comment = reader.cString();
  reader.f32();
  reader.take(28);
  const virtualTempo = { numerator: reader.u16(), denominator: reader.u16() };
  reader.cString();
  reader.cString();
  const subsongCount = reader.u8();
  reader.take(3);
  for (let i = 0; i < subsongCount; i++) reader.u32();
  const systemName = reader.cString();
  for (let i = 0; i < 5; i++) reader.cString();
  const chipVolumes = chips.map(() => {
    const volume = reader.f32();
    reader.f32();
    reader.f32();
    return Math.round(volume * 1e6) / 1e6;
  });
  const connectionCount = reader.u32();
  for (let i = 0; i < connectionCount; i++) reader.u32();
  reader.u8();
  reader.take(8);
  const speedCount = reader.u8();
  const speeds = [...reader.take(16)].slice(0, speedCount);
  if (speeds[0] !== firstSpeed) throw new Error('the first speed and the speed list differ');
  const song: FurSong = {
    name,
    author,
    systemName,
    comment,
    chips,
    chipVolumes,
    chipFlags,
    channelCount,
    tickRate,
    speeds,
    virtualTempo,
    patternLength,
    highlights,
    orders,
    effectColumns,
  };
  return {
    song,
    instruments: instrumentPointers.map((pointer) => getBlockAt(bytes, pointer)),
    wavetables: wavetablePointers.map((pointer) => getBlockAt(bytes, pointer)),
    patterns: patternPointers.map((pointer) => readPattern(bytes, pointer, patternLength)),
  };
}

function getChannelsOfChip(chip: number): number {
  const channels = CHANNELS_OF_CHIP.get(chip);
  if (channels === undefined) throw new Error(`chip 0x${chip.toString(16)} is not read`);
  return channels;
}

/** A whole block (id, length, body) starting at a position. */
function getBlockAt(bytes: Uint8Array, position: number): Uint8Array {
  const size = new ByteReader(bytes, position + 4).u32();
  return bytes.slice(position, position + 8 + size);
}

function readPattern(bytes: Uint8Array, position: number, patternLength: number): Pattern {
  const reader = new ByteReader(bytes, position);
  if (reader.ascii(4) !== 'PATN') throw new Error(`no pattern at ${position}`);
  reader.u32();
  const subsong = reader.u8();
  if (subsong !== 0) throw new Error('only the first subsong is read');
  const channel = reader.u8();
  const index = reader.u16();
  reader.cString();
  return { channel, index, rows: unpackRows(reader, patternLength) };
}
