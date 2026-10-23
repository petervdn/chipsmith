/**
 * An example of a job's script (the furnace-song skill): one short NES song in D minor, eight bars of
 * a bouncing bass, a held pulse motif and a drum pattern, with instruments after the old project's
 * fm_01, its parts written with the kit (`make/score.ts`).
 * Check: `node make/check-script.ts make/example-script.ts`.
 */
import { ARP_FIXED, makeInstrument, NES_INSTRUMENT } from '../fur/instrument.ts';
import { buildFurFile } from './fur-file-builder.ts';
import type { Rows } from './score.ts';
import { getEmptyRows, getNote, PITCH_SHIFT, writeBars, writeHits } from './score.ts';
import type { SongPlan } from './song-plan.ts';

const SIZE = { bars: 8, rowsPerBar: 16 };

/** Instruments by index, as the rows name them. */
const LEAD = 0;
const BASS = 1;
const KICK = 2;
const SNARE = 3;
const HAT = 4;

/**
 * Returns the bass part on the triangle: 16ths with octave jumps and held gaps, D - Bb - C - A.
 *
 * @returns The bass's rows for the whole song.
 */
function getBass(): Rows {
  const rows = getEmptyRows(SIZE);
  const bars = ['D3', 'D3', 'Bb2', 'Bb2', 'C3', 'C3', 'A2', 'A2'].map((root) => {
    const high = root.replace(/\d$/, (octave) => String(Number(octave) + 1));
    return `${root} - ${high} ${root} - ${root} ${high} - ${root} - ${root} ${high} ${root} - ${high} ${root}`;
  });
  writeBars(rows, { ...SIZE, bar: 0, bars, instrument: BASS, shift: PITCH_SHIFT.triangle });
  return rows;
}

/**
 * Returns the lead part on a pulse: a dotted-8th + 16th pickup leaping to a held note, sequenced
 * over the chords, two bars to a motif.
 *
 * @returns The lead's rows for the whole song.
 */
function getLead(): Rows {
  const rows = getEmptyRows(SIZE);
  const motifs = [
    ['A3', 'D4'],
    ['F3', 'Bb3'],
    ['G3', 'C4'],
    ['E3', 'A3'],
  ];
  const bars = motifs.flatMap(([pickup, target]) => [
    `${pickup}:12 - - ${pickup}:10 ${target}:13 - - - - - - - - - - -`,
    '- - - - - - - - - - - - - - - -',
  ]);
  writeBars(rows, { ...SIZE, bar: 0, bars, instrument: LEAD, shift: PITCH_SHIFT.pulse });
  return rows;
}

/**
 * Returns the drum part on the noise channel: kick on 1 and 3, snare on 2 and 4, hats between.
 *
 * @returns The drums' rows for the whole song.
 */
function getDrums(): Rows {
  const rows = getEmptyRows(SIZE);
  const note = getNote('C4');
  writeHits(rows, {
    ...SIZE,
    bar: 0,
    patterns: Array(SIZE.bars).fill('k.h.s.h.k.h.s.h.'),
    hits: new Map([
      ['k', { note, instrument: KICK }],
      ['s', { note, instrument: SNARE }],
      ['h', { note, instrument: HAT, volume: 9 }],
    ]),
  });
  return rows;
}

/**
 * Makes the example's one song.
 *
 * @returns The plan of the song, with its .fur file.
 */
export default function makeSongs(): SongPlan[] {
  const instruments = [
    makeInstrument('lead', NES_INSTRUMENT, [
      { kind: 'vol', values: [13, 12, 11, 10, 10, 9], speed: 2 },
      { kind: 'duty', values: [1] },
    ]),
    makeInstrument('bass', NES_INSTRUMENT, []),
    makeInstrument('kick', NES_INSTRUMENT, [
      { kind: 'vol', values: [15, 13, 9, 5, 2, 0] },
      { kind: 'arp', values: [6, 3, 1, 0].map((note) => ARP_FIXED + note) },
    ]),
    makeInstrument('snare', NES_INSTRUMENT, [
      { kind: 'vol', values: [14, 11, 8, 5, 4, 2, 1, 0] },
      { kind: 'arp', values: [12, 10, 9].map((note) => ARP_FIXED + note) },
    ]),
    makeInstrument('hat', NES_INSTRUMENT, [
      { kind: 'vol', values: [9, 4, 1, 0] },
      { kind: 'duty', values: [0] },
    ]),
  ];
  const empty = getEmptyRows(SIZE);
  return [
    {
      title: 'Example - D minor bounce',
      key: 'D minor',
      tags: ['action', 'example'],
      furFile: buildFurFile({
        title: 'Example - D minor bounce',
        chips: ['nes'],
        bpm: 140,
        beatsPerBar: 4,
        channels: [getLead(), empty, getBass(), getDrums(), empty],
        instruments,
        channelNames: ['Lead', '', 'Bass', 'Drums', ''],
      }),
    },
  ];
}
