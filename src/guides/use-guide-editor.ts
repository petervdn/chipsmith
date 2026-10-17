/**
 * Editing one style guide, or a new one: the draft as it is typed, whether it differs from what is
 * saved, and saving or deleting it. A guide's change reaches only prompts sent after it.
 */
import { useState } from 'react';
import type { Guide, GuideDraft } from '../../shared/guide.types.ts';
import { useDeleteGuide, useSaveGuide } from '../queries/guides.ts';

const EMPTY_DRAFT: GuideDraft = { name: '', text: '', isDefault: false };

/** The draft of `guide` (null: a new one), and saving it; `onDone` follows a save or a delete. */
export function useGuideEditor(guide: Guide | null, onDone: () => void) {
  const [draft, setDraft] = useState<GuideDraft>(() =>
    guide ? { name: guide.name, text: guide.text, isDefault: guide.isDefault } : EMPTY_DRAFT,
  );
  const saving = useSaveGuide();
  const deleting = useDeleteGuide();
  const isChanged =
    !guide ||
    draft.name !== guide.name ||
    draft.text !== guide.text ||
    draft.isDefault !== guide.isDefault;

  function changeDraft(change: Partial<GuideDraft>): void {
    setDraft((current) => ({ ...current, ...change }));
  }
  function save(): void {
    saving.mutate({ guideId: guide?.id ?? null, draft }, { onSuccess: onDone });
  }
  function remove(): void {
    if (!guide || !window.confirm(`Delete the style guide "${guide.name}"?`)) return;
    deleting.mutate(guide.id, { onSuccess: onDone });
  }
  return {
    draft,
    changeDraft,
    save,
    remove,
    canSave: draft.name.trim() !== '' && isChanged && !saving.isPending,
    error: saving.error ?? deleting.error,
  };
}
