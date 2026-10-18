/**
 * The references grouped as the References page lists them: under the app's chip each plays on
 * (NES, SID, SCC), and the words of a reference's facts. Knows nothing of the page.
 */
import type { ReferenceListing } from '../../shared/api.types.ts';
import type { ChipFamily } from '../../shared/reference.schema.ts';

/** A group of references under one of the app's chips. */
export type ReferenceGroup = { family: ChipFamily; label: string; listings: ReferenceListing[] };

/** The groups in order, with their headings. */
const GROUPS: { family: ChipFamily; label: string }[] = [
  { family: 'nes', label: 'NES' },
  { family: 'sid', label: 'SID' },
  { family: 'scc', label: 'SCC' },
];

/**
 * Returns the references grouped under the chip each plays on, a group with none left out.
 *
 * @param listings - The references, in the order to keep within a group.
 * @returns The groups, NES first.
 */
export function getReferenceGroups(listings: ReferenceListing[]): ReferenceGroup[] {
  return GROUPS.map(({ family, label }) => ({
    family,
    label,
    listings: listings.filter((listing) => listing.family === family),
  })).filter((group) => group.listings.length > 0);
}

/**
 * Returns a reference's chips as one line: `NES + VRC6`.
 *
 * @param listing - The reference.
 * @param listing.chips - Its chips' labels.
 * @returns The line.
 */
export function getChipLine({ chips }: ReferenceListing): string {
  return chips.join(' + ');
}
