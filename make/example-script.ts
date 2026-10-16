/**
 * An example of a job's script (notes/making-songs.md): one short NES song in D minor, eight bars of
 * a bouncing bass, a held pulse motif and a drum pattern, with instruments after the archive's fm_01.
 * Check: `node make/check-script.ts make/example-script.ts`.
 */
import type { Row } from '../fur/fur.types.ts';
import { ARP_FIXED, makeInstrument, NES_INSTRUMENT } from '../fur/instrument.ts';
import { getNoteValue } from '../fur/notes.ts';
import { buildModule } from './module-builder.ts';
import type { SongPlan } from './song-plan.ts';

const ROWS_PER_BAR = 16;
const BARS = 8;

/** Instruments by index, as the rows name them. */
const LEAD = 0;
const BASS = 1;
const KICK = 2;
const SNARE = 3;
const HAT = 4;

/** A note in a row: pulse notes are written an octave down (CLAUDE.md, "Pitch naming"). */
function getRow(note: string, instrument: number, volume?: number): Row {
  return { note: getNoteValue(note), instrument, ...(volume === undefined ? {} : { volume }) };
}

/** A whole song's empty rows. */
function getEmpty(): (Row | null)[] {
  return Array.from({ length: BARS * ROWS_PER_BAR }, () => null);
}

/** The bass: 16ths with octave jumps and rests, on the triangle, following D - Bb - C - A. */
function getBass(): (Row | null)[] {
  const rows = getEmpty();
  const roots = ['D-3', 'D-3', 'A#2', 'A#2', 'C-3', 'C-3', 'A-2', 'A-2'];
  roots.forEach((root, bar) => {
    const high = root.replace(/(\d)$/, (octave) => String(Number(octave) + 1));
    const figure = [
      root,
      null,
      high,
      root,
      null,
      root,
      high,
      null,
      root,
      null,
      root,
      high,
      root,
      null,
      high,
      root,
    ];
    figure.forEach((note, i) => {
      if (note) rows[bar * ROWS_PER_BAR + i] = getRow(note, BASS);
    });
  });
  return rows;
}

/** The lead: a dotted-8th + 16th pickup leaping to a held note, sequenced over the chords. */
function getLead(): (Row | null)[] {
  const rows = getEmpty();
  const motifs = [
    ['A-2', 'D-3'],
    ['F-2', 'A#2'],
    ['G-2', 'C-3'],
    ['E-2', 'A-2'],
  ];
  motifs.forEach(([pickup = 'A-2', target = 'D-3'], phrase) => {
    const start = phrase * 2 * ROWS_PER_BAR;
    rows[start] = getRow(pickup, LEAD, 12);
    rows[start + 3] = getRow(pickup, LEAD, 10);
    rows[start + 4] = getRow(target, LEAD, 13);
  });
  return rows;
}

/** The drums on the noise channel: kick on 1 and 3, snare on 2 and 4, hats between. */
function getDrums(): (Row | null)[] {
  const rows = getEmpty();
  for (let bar = 0; bar < BARS; bar++) {
    for (let step = 0; step < ROWS_PER_BAR; step += 2) {
      const at = bar * ROWS_PER_BAR + step;
      if (step % 8 === 0) rows[at] = getRow('C-4', KICK);
      else if (step % 8 === 4) rows[at] = getRow('C-4', SNARE);
      else rows[at] = getRow('C-4', HAT, 9);
    }
  }
  return rows;
}

/** The song. */
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
  const empty = getEmpty();
  return [
    {
      title: 'Example - D minor bounce',
      key: 'D minor',
      tags: ['action', 'example'],
      module: buildModule({
        title: 'Example - D minor bounce',
        chips: 'nes',
        bpm: 140,
        beatsPerBar: 4,
        channels: [getLead(), empty, getBass(), getDrums(), empty],
        instruments,
      }),
    },
  ];
}
