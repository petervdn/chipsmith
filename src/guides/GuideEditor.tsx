// One style guide opened for editing on the Guides page, or a new one: its name, its text, whether
// it is chosen by default, Save, Delete and Cancel.
import type { Guide } from '../../shared/guide.types.ts';
import { useGuideEditor } from './use-guide-editor.ts';
import '../lists/lists.css';
import './guides.css';
import './GuideEditor.css';

type GuideEditorProps = { guide: Guide | null; onDone: () => void };

/** The guide editor. */
export function GuideEditor({ guide, onDone }: GuideEditorProps) {
  const { draft, changeDraft, save, remove, canSave, error } = useGuideEditor(guide, onDone);
  return (
    <form
      className="guide-editor"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) save();
      }}
    >
      <input
        className="guide-name"
        placeholder="Name, e.g. Funk"
        value={draft.name}
        onChange={(event) => changeDraft({ name: event.target.value })}
        autoFocus={!guide}
      />
      <textarea
        className="guide-text"
        placeholder="What Claude should keep to in this style: harmony, rhythm, sounds, form, what to avoid…"
        value={draft.text}
        onChange={(event) => changeDraft({ text: event.target.value })}
      />
      <label className="filter-switch">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(event) => changeDraft({ isDefault: event.target.checked })}
        />
        Chosen by default for a new prompt
      </label>
      <div className="guide-actions">
        <button type="submit" className="guide-save" disabled={!canSave}>
          Save
        </button>
        <button type="button" className="row-action" onClick={onDone}>
          Cancel
        </button>
        {guide && (
          <button type="button" className="row-action guide-delete" onClick={remove}>
            Delete
          </button>
        )}
      </div>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
