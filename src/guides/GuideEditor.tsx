// One style guide opened for editing on the Guides page, or a new one: its name, its text, whether
// it is chosen by default, Save, Delete and Cancel.
import type { Guide } from '../../shared/guide.types.ts';
import { useGuideEditor } from './use-guide-editor.ts';
import '../lists/lists.css';
import './guides.css';
import './GuideEditor.css';

type GuideEditorProps = { guide: Guide | null; onDone: () => void };

/**
 * Shows a style guide opened for editing, or a new one: its name, its text, whether it is chosen by
 * default, Save, Cancel and (for a guide that exists) Delete.
 *
 * @param props - The component's props.
 * @param props.guide - The guide edited, or null for a new one.
 * @param props.onDone - Called after a save or a delete, and on Cancel.
 * @returns The editor's form element.
 */
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
        className="guide-editor-name"
        placeholder="Name, e.g. Funk"
        value={draft.name}
        onChange={(event) => changeDraft({ name: event.target.value })}
        autoFocus={!guide}
      />
      <textarea
        className="guide-editor-text"
        placeholder="What Claude should keep to in this style: harmony, rhythm, sounds, form, what to avoid…"
        value={draft.text}
        onChange={(event) => changeDraft({ text: event.target.value })}
      />
      <label className="list-switch">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(event) => changeDraft({ isDefault: event.target.checked })}
        />
        Preselected by default on New (any number of guides can be)
      </label>
      <div className="guide-editor-actions">
        <button type="submit" className="guides-save" disabled={!canSave}>
          Save
        </button>
        <button type="button" className="list-action" onClick={onDone}>
          Cancel
        </button>
        {guide && (
          <button type="button" className="list-action guide-editor-delete" onClick={remove}>
            Delete
          </button>
        )}
      </div>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
