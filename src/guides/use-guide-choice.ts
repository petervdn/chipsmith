/**
 * The style guides chosen for a prompt: the default ones (or those it is told to start with) until
 * a chip is toggled, then what was toggled; back to the start after a prompt is sent. Nothing
 * carries over from another song.
 */
import { useState } from 'react';
import type { Guide } from '../../shared/guide.schema.ts';
import { useGuides } from '../queries/guides.ts';

/**
 * Keeps the style guides chosen for a prompt: the default ones, or those given to start with, until
 * a chip is toggled, then what was toggled.
 *
 * @param startIds - The ids of the guides chosen at the start (those that still exist), or
 *   undefined for the default ones.
 * @returns Every guide (`guides`), the ids of those chosen (`chosenIds`), a handler that toggles
 *   one (`toggleGuide`), and one that goes back to the defaults (`resetChoice`).
 */
export function useGuideChoice(startIds?: string[]): {
  guides: Guide[];
  chosenIds: string[];
  toggleGuide: (guideId: string) => void;
  resetChoice: () => void;
} {
  const [toggledIds, setToggledIds] = useState<string[] | null>(null);
  const guides = useGuides().data ?? [];
  const known = toggledIds?.filter((guideId) => guides.some((guide) => guide.id === guideId));
  const startingIds = startIds
    ? startIds.filter((guideId) => guides.some((guide) => guide.id === guideId))
    : guides.filter((guide) => guide.isDefault).map((guide) => guide.id);
  const chosenIds = known ?? startingIds;

  function toggleGuide(guideId: string): void {
    setToggledIds(
      chosenIds.includes(guideId)
        ? chosenIds.filter((id) => id !== guideId)
        : [...chosenIds, guideId],
    );
  }
  return { guides, chosenIds, toggleGuide, resetChoice: () => setToggledIds(null) };
}
