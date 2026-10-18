// The structure chosen for a prompt on New (AABA at first): none, a preset or a saved one, its
// sections as edited here (an edit leaves the preset or saved structure as it is until saved), the
// section selected, and saving it as a new structure or over the saved one, or deleting a saved one.
import { useState } from 'react';
import { readNotation } from '../../shared/structure-notation.ts';
import { STRUCTURE_PRESETS } from '../../shared/structure-presets.ts';
import type { Section, SentStructure } from '../../shared/structure.schema.ts';
import { useDeleteStructure, useSaveStructure, useStructures } from '../queries/structures.ts';

/** Where the structure being edited came from: none, a preset, a saved structure, or a new one. */
export type StructureSource =
  | { kind: 'none' }
  | { kind: 'own' }
  | { kind: 'preset'; id: string }
  | { kind: 'saved'; id: string };

/** The preset chosen when New opens. */
const DEFAULT_PRESET = STRUCTURE_PRESETS.find((preset) => preset.id === 'aaba');

/**
 * Keeps the structure chosen for a prompt, the default preset at first.
 *
 * @returns The presets and saved structures to choose from, the source chosen, its name and
 *   sections, whether they were edited, the section selected; `choose`, `edit` (sections changed,
 *   an edit), `select`, `save` (with a name: a new structure, else over the saved one), `remove`
 *   (deletes the saved one), and `sent`: the structure to send with the prompt, or null.
 */
export function useStructureChoice() {
  const [source, setSource] = useState<StructureSource>(
    DEFAULT_PRESET ? { kind: 'preset', id: DEFAULT_PRESET.id } : { kind: 'none' },
  );
  const [name, setName] = useState(DEFAULT_PRESET?.name ?? '');
  const [sections, setSections] = useState<Section[]>(DEFAULT_PRESET?.sections ?? []);
  const [isEdited, setEdited] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
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
    setSource(chosen || isOwn ? next : { kind: 'none' });
    setName(chosen?.name ?? '');
    setSections(chosen?.sections ?? (isOwn ? (readNotation('A8 A8 B8 A8').sections ?? []) : []));
    setEdited(false);
    setSelected(null);
  }
  function edit(change: (current: Section[]) => Section[]): void {
    setSections((current) => change(current));
    setEdited(true);
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
          if (kept) {
            setSource({ kind: 'saved', id: kept.id });
            setName(kept.name);
          }
          setEdited(false);
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
