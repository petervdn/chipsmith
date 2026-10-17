// A reference's channels named from its chips, its chips' labels, and the chip it is listed under.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getChannelNames, getChipFamily, getChipLabels } from './demo-chips.ts';

test('the channels are named chip by chip, in order', () => {
  assert.deepEqual(getChannelNames(['NES (Ricoh 2A03)', 'Konami VRC6']), [
    'Pulse 1',
    'Pulse 2',
    'Triangle',
    'Noise',
    'DPCM',
    'VRC6 Pulse 1',
    'VRC6 Pulse 2',
    'VRC6 Saw',
  ]);
});

test('a chip that comes twice numbers its channels', () => {
  assert.deepEqual(getChannelNames(['Commodore 64 (SID 8580)', 'Commodore 64 (SID 8580)']), [
    'Voice 1 (SID 8580 1)',
    'Voice 2 (SID 8580 1)',
    'Voice 3 (SID 8580 1)',
    'Voice 1 (SID 8580 2)',
    'Voice 2 (SID 8580 2)',
    'Voice 3 (SID 8580 2)',
  ]);
});

test('a chip not known names no channels', () => {
  assert.equal(getChannelNames(['NES (Ricoh 2A03)', 'Yamaha YM2413 (OPLL)']), null);
});

test('labels, and the first of NES, SID and SCC a reference plays on', () => {
  assert.deepEqual(getChipLabels(['AY-3-8910', 'Konami SCC+', 'SNES']), ['PSG', 'SCC+', 'SNES']);
  assert.equal(getChipFamily(['AY-3-8910', 'Konami SCC']), 'scc');
  assert.equal(getChipFamily(['NES (Ricoh 2A03)', 'Konami VRC6']), 'nes');
  assert.equal(getChipFamily(['AY-3-8910']), null);
});
