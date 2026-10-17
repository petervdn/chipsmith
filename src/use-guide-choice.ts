/**
 * The style guides chosen for a prompt: the default ones until a chip is toggled, then what was
 * toggled; back to the defaults after a prompt is sent. Nothing carries over from another song.
 */
import { useState } from 'react';
import type { Guide } from '../shared/guide.types.ts';
import { useGuides } from './queries/guides.ts';

/** The guides, which are chosen, toggling one, and going back to the defaults. */
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
