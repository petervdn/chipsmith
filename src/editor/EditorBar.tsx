// The editor's bar of controls above the timeline, in groups: play (stop, play or pause), edit (undo,
// redo), snap, tracks (split, when the song can be), zoom, and the song (revert, save). It wraps on
// a phone. It knows nothing of what the controls do: it is given the values and handlers.
import type { useSongDraft } from './use-song-draft.ts';
import type { useSongTransport } from './use-song-transport.ts';
import { ControlGroup } from './ControlGroup.tsx';
import type { GridStep } from './grid.ts';
import { BAR_STEP, GRID_STEPS } from './grid.ts';
import { TransportButtons } from './TransportButtons.tsx';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import './EditorBar.css';

type EditorBarProps = {
  transport: ReturnType<typeof useSongTransport>;
  isWaitingForAudio: boolean;
  draft: ReturnType<typeof useSongDraft>;
  step: GridStep;
  onStep: (step: GridStep) => void;
  splitCount: number;
  isSplitting: boolean;
  onSplit: () => void;
  zoom: { zoomIn: () => void; zoomOut: () => void; fit: () => void };
};

/**
 * Shows the editor's bar of controls.
 *
 * @param props - The component's props.
 * @param props.transport - Playing the song: its mode, pause, stop and play.
 * @param props.isWaitingForAudio - Whether the song's audio is still being rendered, so it cannot play.
 * @param props.draft - The song being edited: undo, redo, revert and save, and whether it changed.
 * @param props.step - What blocks snap to.
 * @param props.onStep - Called with the step chosen to snap to.
 * @param props.splitCount - Into how many channels the song can be split; 0 when it cannot.
 * @param props.isSplitting - Whether a split is on its way.
 * @param props.onSplit - Called to split the song (after asking).
 * @param props.zoom - Zooming the timeline: in, out, and fitting the song to it.
 * @returns The bar's element.
 */
export function EditorBar({
  transport,
  isWaitingForAudio,
  draft,
  step,
  onStep,
  splitCount,
  isSplitting,
  onSplit,
  zoom,
}: EditorBarProps) {
  const isFollowing = usePreferencesStore((state) => state.isFollowingPlayhead);
  const setFollowing = usePreferencesStore((state) => state.setFollowingPlayhead);
  return (
    <div className="editor-bar">
      <TransportButtons
        mode={transport.mode}
        isPaused={transport.isPaused}
        isWaitingForAudio={isWaitingForAudio}
        onStop={transport.stop}
        onTogglePlaying={transport.togglePlaying}
        isFollowing={isFollowing}
        onToggleFollowing={() => setFollowing(!isFollowing)}
      />
      <ControlGroup label="edit">
        <button
          type="button"
          onClick={draft.undo}
          disabled={!draft.canUndo}
          data-tooltip="undo (⌘Z)"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={draft.redo}
          disabled={!draft.canRedo}
          data-tooltip="redo (⇧⌘Z)"
        >
          ↷
        </button>
      </ControlGroup>
      <ControlGroup label="snap">
        <select
          className="editor-bar-grid"
          value={step.id}
          onChange={(event) =>
            onStep(GRID_STEPS.find((candidate) => candidate.id === event.target.value) ?? BAR_STEP)
          }
          data-tooltip="what blocks snap to when dragged (Alt: no snapping)"
        >
          {GRID_STEPS.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
      </ControlGroup>
      {splitCount > 0 && (
        <ControlGroup label="tracks">
          <button
            type="button"
            className="editor-bar-button"
            onClick={onSplit}
            disabled={draft.hasChanges || isSplitting}
            data-tooltip={
              draft.hasChanges
                ? 'save or revert the changes first'
                : 'make a track per channel, each the whole song on that channel alone'
            }
          >
            {isSplitting ? 'Splitting…' : `Split into ${splitCount} channels`}
          </button>
        </ControlGroup>
      )}
      <ControlGroup label="zoom">
        <button type="button" onClick={zoom.zoomOut} data-tooltip="zoom out">
          −
        </button>
        <button type="button" onClick={zoom.fit} data-tooltip="fit the song to the screen">
          fit
        </button>
        <button type="button" onClick={zoom.zoomIn} data-tooltip="zoom in">
          +
        </button>
      </ControlGroup>
      <ControlGroup label="song" isAtEnd>
        {draft.hasChanges && <span className="editor-bar-unsaved">unsaved changes</span>}
        {draft.hasChanges && (
          <button type="button" className="editor-bar-button" onClick={draft.revert}>
            Revert
          </button>
        )}
        <button
          type="button"
          className="editor-bar-button is-primary"
          onClick={draft.save}
          disabled={!draft.hasChanges || draft.isSaving}
          data-tooltip="save the song as it is now (⌘S)"
        >
          {draft.isSaving ? 'Saving…' : 'Save'}
        </button>
      </ControlGroup>
    </div>
  );
}
