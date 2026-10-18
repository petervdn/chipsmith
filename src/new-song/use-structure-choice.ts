// The structure chosen for a prompt on New (none at first): none, a preset or a saved one, its
// sections as edited here (an edit leaves the preset or saved structure as it is until saved), the
// section selected, and saving it as a new structure or over the saved one, or deleting a saved one.
// The structure as edited is kept between visits (stores/new-song-store.ts); the section selected,
// while the page is open.
import { useState } from 'react';
import { readNotation } from '../../shared/structure-notation.ts';
import { STRUCTURE_PRESETS } from '../../shared/structure-presets.ts';
import type { Section, SentStructure } from '../../shared/structure.schema.ts';
import { useDeleteStructure, useSaveStructure, useStructures } from '../queries/structures.ts';
import type { StructureSource } from '../stores/new-song-store.ts';
import { useNewSongStore } from '../stores/new-song-store.ts';

/**
 * Keeps the structure chosen for a prompt, none at first.
 *
 * @returns The presets and saved structures to choose from, the source chosen, its name and
 *   sections, whether they were edited, the section selected; `choose`, `edit` (sections changed,
 *   an edit), `select`, `save` (with a name: a new structure, else over the saved one), `remove`
 *   (deletes the saved one), and `sent`: the structure to send with the prompt, or null.
 */
export function useStructureChoice() {
  const structure = useNewSongStore((state) => state.structure);
  const setStructure = useNewSongStore((state) => state.setStructure);
  const [selected, setSelected] = useState<number | null>(null);
  const { source, name, sections, isEdited } = structure;
  const { data: saved } = useStructures();
  const { mutate: saveStructure, isPending: isSaving, error: saveError } = useSaveStructure();
  const { mutate: deleteStructure } = useDeleteStructure();

  function choose(next: StructureSource): void {
    const chosen =
      next.kind === 'preset'
        ? STRUCTURE_PRESETS.find((preset) => preset.id === next.id)
        : next.kind === 'saved'
          ? saved?.find((structure) => structure.id === next.id)
          : undefined;
    const isOwn = next.kind === 'own';
    setStructure({
      source: chosen || isOwn ? next : { kind: 'none' },
      name: chosen?.name ?? '',
      sections: chosen?.sections ?? (isOwn ? (readNotation('A8 A8 B8 A8').sections ?? []) : []),
      isEdited: false,
    });
    setSelected(null);
  }
  function edit(change: (current: Section[]) => Section[]): void {
    const current = useNewSongStore.getState().structure;
    setStructure({ ...current, sections: change(current.sections), isEdited: true });
  }
  function save(newName: string | null): void {
    const structureId = newName === null && source.kind === 'saved' ? source.id : null;
    const draft = { name: newName ?? name, sections };
    saveStructure(
      { structureId, draft },
      {
        onSuccess: (structures) => {
          const kept = structureId
            ? structures.find((structure) => structure.id === structureId)
            : structures
                .filter((structure) => structure.name === draft.name)
                .sort((first, second) => second.created.localeCompare(first.created))[0];
          const current = useNewSongStore.getState().structure;
          setStructure(
            kept
              ? {
                  ...current,
                  source: { kind: 'saved', id: kept.id },
                  name: kept.name,
                  isEdited: false,
                }
              : { ...current, isEdited: false },
          );
        },
      },
    );
  }
  function remove(): void {
    if (source.kind !== 'saved') return;
    deleteStructure(source.id);
    choose({ kind: 'none' });
  }
  const sent: SentStructure | null =
    source.kind === 'none' || sections.length === 0
      ? null
      : { name: getSentName(name, isEdited), sections };
  return {
    presets: STRUCTURE_PRESETS,
    saved: saved ?? [],
    source,
    name,
    sections,
    isEdited,
    selected,
    choose,
    edit,
    select: setSelected,
    save,
    remove,
    isSaving,
    saveError,
    sent,
  };
}

/**
 * Returns the name a structure is sent with.
 *
 * @param name - Its name, empty for one written for the prompt.
 * @param isEdited - Whether it was edited since it was chosen or saved.
 * @returns The name, marked as changed when edited, or one saying it was written for the prompt.
 */
function getSentName(name: string, isEdited: boolean): string {
  if (!name) return 'written for this prompt';
  return isEdited ? `${name} (changed)` : name;
}
