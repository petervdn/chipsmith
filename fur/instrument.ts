/**
 * An instrument (INS2 block) and a wavetable (WAVE block), as this project writes them: a name and
 * macros (volume, arpeggio, duty, wave, pitch), and a wavetable's samples.
 */
import { ByteWriter } from './bytes.ts';
import { FORMAT_VERSION, makeBlock } from './block.ts';

/** The macros an instrument may have, by Furnace's code for each. */
const MACRO_CODES = { vol: 0, arp: 1, duty: 2, wave: 3, pitch: 4 } satisfies Record<string, number>;

/** The kind of a macro. */
export type MacroKind = keyof typeof MACRO_CODES;

/** A macro: its values, where it loops and releases (255 is none), and its speed. */
export type Macro = {
  kind: MacroKind;
  values: number[];
  loop?: number;
  release?: number;
  speed?: number;
};

/** Added to an arpeggio value, makes it a fixed note instead of an offset. */
export const ARP_FIXED = 0x40000000;
/** Furnace's instrument type for the NES. */
export const NES_INSTRUMENT = 34;
/** The size of a macro's header in bytes. */
const MACRO_HEADER_SIZE = 8;
/** "None" for a macro's loop and release. */
const NO_POINT = 255;
/** The flags of a macro whose values are bytes, and of one whose values are 32-bit. */
const BYTE_VALUES = 0x01;
const WIDE_VALUES = 0xc1;

/**
 * Makes an INS2 block: a name and its macros, in the order given.
 *
 * @param name - The instrument's name.
 * @param type - Furnace's instrument type, such as `NES_INSTRUMENT`.
 * @param macros - The macros, written in this order; with none, the block has no macro feature.
 * @returns The INS2 block's bytes.
 */
export function makeInstrument(name: string, type: number, macros: Macro[]): Uint8Array {
  const body = new ByteWriter().u16(FORMAT_VERSION).u16(type);
  const nameBytes = new ByteWriter().cString(name).getBytes();
  body.ascii('NA').u16(nameBytes.length).add(nameBytes);
  if (macros.length > 0) {
    const macroBytes = new ByteWriter().u16(MACRO_HEADER_SIZE);
    for (const macro of macros) addMacro(macroBytes, macro);
    macroBytes.u8(0xff);
    const macroData = macroBytes.getBytes();
    body.ascii('MA').u16(macroData.length).add(macroData);
  }
  body.ascii('EN');
  return makeBlock('INS2', body.getBytes());
}

/**
 * Makes a WAVE block, its samples stored as Furnace does. Throws if a sample is outside 0..255.
 *
 * @param samples - The samples, 0..255 each (32 of them for the SCC).
 * @param name - The wavetable's name, empty if not given.
 * @returns The WAVE block's bytes.
 */
export function makeWavetable(samples: number[], name = ''): Uint8Array {
  if (samples.some((sample) => sample < 0 || sample > 255)) {
    throw new Error('a wavetable sample is outside 0..255');
  }
  const body = new ByteWriter().cString(name).u32(samples.length).u32(0).u32(255);
  for (const sample of samples) body.u32(sample);
  return makeBlock('WAVE', body.getBytes());
}

function addMacro(
  writer: ByteWriter,
  { kind, values, loop = NO_POINT, release = NO_POINT, speed = 1 }: Macro,
): void {
  const isWide =
    kind === 'arp' || kind === 'pitch' || values.some((value) => value < 0 || value > 255);
  writer.add([
    MACRO_CODES[kind],
    values.length,
    loop,
    release,
    0,
    isWide ? WIDE_VALUES : BYTE_VALUES,
    0,
    speed,
  ]);
  for (const value of values) {
    if (isWide) writer.i32(value);
    else writer.u8(value);
  }
}
