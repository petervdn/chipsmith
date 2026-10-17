/**
 * A SID instrument's settings: the `64` feature of its INS2 block, as Furnace lays it out from format
 * version 199 (Furnace's papers/newIns.md, checked against the C64 demos): its waveforms, envelope,
 * duty, filter and flags, read and written byte for byte. Knows nothing of the rest of the file.
 */
import { ByteReader, ByteWriter } from './bytes.ts';

/** Furnace's instrument type for the C64 SID. */
export const SID_INSTRUMENT = 3;

/** A SID waveform; several are mixed by AND, noise alone. */
export type SidWave = 'tri' | 'saw' | 'pulse' | 'noise';

/** A SID filter mode; several make a notch (low + high) and the like. `ch3off` mutes channel 3. */
export type SidFilterMode = 'low' | 'high' | 'band' | 'ch3off';

/** A SID instrument's settings. */
export type SidSettings = {
  waves: SidWave[];
  /** The envelope, each 0-15. */
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  /** The pulse width, 0-4095 (2048 is square). */
  duty: number;
  /** Whether the duty macro sets the width (0-4095) instead of moving it. */
  isDutyAbsolute: boolean;
  /** Whether a new note restores `duty`. */
  isDutyReset: boolean;
  /** Whether the instrument plays through the filter. */
  isFiltered: boolean;
  /** Whether a note sets the filter to `cutoff`, `resonance` and `filterModes`. */
  isFilterSet: boolean;
  /** Whether the cutoff macro sets the cutoff (0-2047) instead of moving it. */
  isCutoffAbsolute: boolean;
  /** The filter's cutoff, 0-2047, and resonance, 0-15. */
  cutoff: number;
  resonance: number;
  filterModes: SidFilterMode[];
  /** Ring modulation and hard sync by the channel before. */
  isRing: boolean;
  isSync: boolean;
  /** Whether a new note skips the one-tick hard reset (test bit). */
  isTestSkipped: boolean;
};

const WAVE_BITS = ['tri', 'saw', 'pulse', 'noise'] satisfies SidWave[];
const FILTER_BITS = ['low', 'high', 'band', 'ch3off'] satisfies SidFilterMode[];
/** The feature's length in bytes from version 199 on. */
const FEATURE_LENGTH = 9;
const CUTOFF_MASK = 0x7ff;
const RESONANCE_SHIFT = 12;
const DUTY_RESET_BIT = 0x10;

/** The settings a SID instrument has where a script leaves them out (as Furnace's new ones). */
const DEFAULT_SETTINGS: Omit<SidSettings, 'waves' | 'attack' | 'decay' | 'sustain' | 'release'> = {
  duty: 2048,
  isDutyAbsolute: false,
  // measured: in a file of version 222 on, a pulse without it stays at width 0 and is silent
  isDutyReset: true,
  isFiltered: false,
  isFilterSet: false,
  isCutoffAbsolute: false,
  cutoff: 0,
  resonance: 0,
  filterModes: [],
  isRing: false,
  isSync: false,
  isTestSkipped: false,
};

/**
 * Makes a SID instrument's `64` feature, its code and length included, to pass to makeInstrument.
 *
 * @param settings - The settings; the waves and the envelope are needed, the rest is Furnace's
 *   default when left out (a square duty, no filter, no ring or sync).
 * @returns The feature's bytes.
 */
export function makeSidFeature(
  settings: Pick<SidSettings, 'waves' | 'attack' | 'decay' | 'sustain' | 'release'> &
    Partial<SidSettings>,
): Uint8Array {
  const sid: SidSettings = { ...DEFAULT_SETTINGS, ...settings };
  const flags1 =
    getBits(WAVE_BITS, sid.waves) |
    (sid.isFiltered ? 0x10 : 0) |
    (sid.isFilterSet ? 0x40 : 0) |
    (sid.isDutyAbsolute ? 0x80 : 0);
  const flags2 =
    getBits(FILTER_BITS, sid.filterModes) |
    (sid.isCutoffAbsolute ? 0x10 : 0) |
    (sid.isTestSkipped ? 0x20 : 0) |
    (sid.isRing ? 0x40 : 0) |
    (sid.isSync ? 0x80 : 0);
  return new ByteWriter()
    .ascii('64')
    .u16(FEATURE_LENGTH)
    .add([flags1, flags2, (sid.attack << 4) | sid.decay, (sid.sustain << 4) | sid.release])
    .u16(sid.duty)
    .u16((sid.resonance << RESONANCE_SHIFT) | (sid.cutoff & CUTOFF_MASK))
    .u8(sid.isDutyReset ? DUTY_RESET_BIT : 0)
    .getBytes();
}

/**
 * Reads a SID instrument's settings from its `64` feature.
 *
 * @param data - The feature's data, after its code and length (8 or 9 bytes).
 * @returns The settings.
 */
export function readSidFeature(data: Uint8Array): SidSettings {
  const reader = new ByteReader(data, 0);
  const [flags1 = 0, flags2 = 0, attackDecay = 0, sustainRelease = 0] = reader.take(4);
  const duty = reader.u16();
  const cutoffResonance = reader.u16();
  const extra = data.length > 8 ? reader.u8() : 0;
  return {
    waves: WAVE_BITS.filter((_wave, i) => flags1 & (1 << i)),
    attack: attackDecay >> 4,
    decay: attackDecay & 15,
    sustain: sustainRelease >> 4,
    release: sustainRelease & 15,
    duty,
    isDutyAbsolute: (flags1 & 0x80) !== 0,
    isDutyReset: (extra & DUTY_RESET_BIT) !== 0,
    isFiltered: (flags1 & 0x10) !== 0,
    isFilterSet: (flags1 & 0x40) !== 0,
    isCutoffAbsolute: (flags2 & 0x10) !== 0,
    cutoff: cutoffResonance & CUTOFF_MASK,
    resonance: cutoffResonance >> RESONANCE_SHIFT,
    filterModes: FILTER_BITS.filter((_mode, i) => flags2 & (1 << i)),
    isRing: (flags2 & 0x40) !== 0,
    isSync: (flags2 & 0x80) !== 0,
    isTestSkipped: (flags2 & 0x20) !== 0,
  };
}

/**
 * Returns the bits of the names chosen, each name's bit its place in the list.
 *
 * @param names - The names, in the order of their bits.
 * @param chosen - The names chosen.
 * @returns The bits, OR'd together.
 */
function getBits<Name extends string>(names: Name[], chosen: Name[]): number {
  return names.reduce((bits, name, i) => (chosen.includes(name) ? bits | (1 << i) : bits), 0);
}
