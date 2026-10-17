// References grouped under the app's chips, and their chips as one line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ReferenceListing } from '../../shared/api.types.ts';
import { getChipLine, getReferenceGroups } from './reference-groups.ts';

function getListing(id: string, family: ReferenceListing['family'], chips: string[]) {
  const listing: ReferenceListing = {
    reference: { id, file: '', imported: '', notes: '' },
    name: id,
    author: '',
    album: '',
    chips,
    family,
    channels: [],
    subsongCount: 1,
    seconds: null,
  };
  return listing;
}

test('references are grouped NES, SID, SCC, an empty group left out', () => {
  const scc = getListing('r0001', 'scc', ['AY-3-8910', 'SCC']);
  const nes = getListing('r0002', 'nes', ['NES', 'VRC6']);
  const other = getListing('r0003', null, ['AY-3-8910']);
  const groups = getReferenceGroups([scc, nes, other]);
  assert.deepEqual(
    groups.map((group) => [group.label, group.listings.map((listing) => listing.reference.id)]),
    [
      ['NES', ['r0002']],
      ['SCC', ['r0001']],
    ],
  );
  assert.equal(getChipLine(nes), 'NES + VRC6');
});
