// The chosen structure as tiles as wide as their bars, coloured by part, a variation striped and a
// repeat faint; between two tiles the gap, showing how the one leads into the next (+ while it is
// Claude's choice); a tap on a tile or a gap selects it. While the panel is open, + at the end adds
// a part.
import { Plus } from 'lucide-react';
import type { CSSProperties } from 'react';
import { getLeadIn } from '../../shared/lead-ins.ts';
import { getRelation, getSectionName } from '../../shared/structure-notation.ts';
import type { Section } from '../../shared/structure.types.ts';
import { getTrackColor } from '../editor/timeline.ts';
import './StructureTiles.css';

/** What is selected among the tiles: a section, or the gap before one. */
export type TileSelection = { kind: 'section' | 'gap'; index: number } | null;

type StructureTilesProps = {
  sections: Section[];
  selection: TileSelection;
  isOpen: boolean;
  onSelect: (selection: TileSelection) => void;
  onAdd: () => void;
};

/**
 * Shows a structure's tiles and the gaps between them.
 *
 * @param props - The component's props.
 * @param props.sections - The structure's sections.
 * @param props.selection - The section or gap selected, or null.
 * @param props.isOpen - Whether the panel is open: then + adds a part.
 * @param props.onSelect - Called with what was tapped, or null when the selected one is tapped again.
 * @param props.onAdd - Called to add a new part at the end.
 * @returns The tiles' element.
 */
export function StructureTiles({
  sections,
  selection,
  isOpen,
  onSelect,
  onAdd,
}: StructureTilesProps) {
  function isSelected(kind: 'section' | 'gap', index: number): boolean {
    return selection?.kind === kind && selection.index === index;
  }
  return (
    <div className="structure-tiles">
      {sections.map((section, i) => {
        const relation = getRelation(sections, i);
        const style: CSSProperties & Record<'--tile-color', string> = {
          '--tile-color': getTrackColor(section.letter.charCodeAt(0) - 65),
        };
        const labels = section.leadIn.flatMap((value) => getLeadIn(value)?.label ?? []);
        const before = sections[i - 1];
        const gapName = before ? `${getSectionName(before)} → ${getSectionName(section)}` : '';
        return (
          <span key={i} className="structure-tiles-pair" style={{ flexGrow: section.bars }}>
            {i > 0 && (
              <button
                type="button"
                className={`structure-tiles-gap${labels.length > 0 ? ' is-set' : ''}${isSelected('gap', i) ? ' is-selected' : ''}`}
                onClick={() => onSelect(isSelected('gap', i) ? null : { kind: 'gap', index: i })}
                data-tooltip={`${gapName}: ${labels.length > 0 ? labels.join(', ') : "how it leads in: Claude's choice"}`}
                aria-label={`${gapName}: how it leads in`}
              >
                {labels.length > 0 ? (
                  <>
                    <span className="structure-tiles-gap-labels">{labels.join(' · ')}</span>
                    <span className="structure-tiles-gap-count">{labels.length}</span>
                  </>
                ) : (
                  <Plus />
                )}
              </button>
            )}
            <button
              type="button"
              className={`structure-tiles-tile is-${relation}${isSelected('section', i) ? ' is-selected' : ''}`}
              style={style}
              onClick={() =>
                onSelect(isSelected('section', i) ? null : { kind: 'section', index: i })
              }
              data-tooltip={`${getSectionName(section)}: ${relation}, ${section.bars} bars`}
            >
              <span className="structure-tiles-name">{getSectionName(section)}</span>
              <span className="structure-tiles-bars">
                {section.bars}
                {section.role ? ` · ${section.role}` : ''}
              </span>
            </button>
          </span>
        );
      })}
      {isOpen && (
        <button
          type="button"
          className="structure-tiles-add"
          onClick={onAdd}
          data-tooltip="add a new part at the end"
          aria-label="add a new part at the end"
        >
          <Plus />
        </button>
      )}
    </div>
  );
}
