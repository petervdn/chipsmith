/**
 * Editing one style guide, or a new one: the draft as it is typed, whether it differs from what is
 * saved, and saving or deleting it. A guide's change reaches only prompts sent after it.
 */
import { useState } from 'react';
import type { Guide, GuideDraft } from '../../shared/guide.types.ts';
import { useDeleteGuide, useSaveGuide } from '../queries/guides.ts';
import { askToConfirm } from '../stores/confirm-store.ts';

const EMPTY_DRAFT: GuideDraft = { name: '', text: '', isDefault: false };

/**
 * Keeps the draft of a style guide as it is typed, and saves or deletes it.
 *
 * @param guide - The guide edited, or null for a new one.
 * @param onDone - Called after a save or a delete.
 * @returns The draft (`draft`), a handler that changes fields of it (`changeDraft`), handlers that
 *   save it (`save`) and delete the guide after asking (`remove`), whether it can be saved
 *   (`canSave`: it has a name, differs from what is saved, and no save is on its way), and the
 *   error of a save or a delete (`error`).
 */
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
  async function remove(): Promise<void> {
    if (!guide) return;
    const question = `Delete the style guide "${guide.name}"?`;
    if (!(await askToConfirm({ question, answer: 'Delete', isDanger: true }))) return;
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
