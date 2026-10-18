/**
 * The style guides chosen for a prompt: the default ones until a chip is toggled, then what was
 * toggled; back to the defaults after a prompt is sent. Nothing carries over from another song.
 */
import { useState } from 'react';
import type { Guide } from '../../shared/guide.schema.ts';
import { useGuides } from '../queries/guides.ts';

/**
 * Keeps the style guides chosen for a prompt: the default ones until a chip is toggled, then
 * what was toggled.
 *
 * @returns Every guide (`guides`), the ids of those chosen (`chosenIds`), a handler that toggles
 *   one (`toggleGuide`), and one that goes back to the defaults (`resetChoice`).
 */
export function useGuideChoice(): {
  guides: Guide[];
  chosenIds: string[];
  toggleGuide: (guideId: string) => void;
  resetChoice: () => void;
} {
  const [toggledIds, setToggledIds] = useState<string[] | null>(null);
  const guides = useGuides().data ?? [];
  const known = toggledIds?.filter((guideId) => guides.some((guide) => guide.id === guideId));
  const chosenIds = known ?? guides.filter((guide) => guide.isDefault).map((guide) => guide.id);

  function toggleGuide(guideId: string): void {
    setToggledIds(
      chosenIds.includes(guideId)
        ? chosenIds.filter((id) => id !== guideId)
        : [...chosenIds, guideId],
    );
  }
  return { guides, chosenIds, toggleGuide, resetChoice: () => setToggledIds(null) };
}
