// Export, among the song's actions beside its title (put there by SongEditor.tsx): it opens a
// dialog to export the song as audio, as the editor plays it now (its unsaved edits and faders
// too): the file type, the tracks when some are muted or soloed away, and Export, which asks where
// the file goes where the browser can (use-song-export.ts). A mix that clipped is said before the
// dialog closes.
import { useState } from 'react';
import { EXPORT_FORMATS } from '../../shared/audio-export.ts';
import { Dialog } from '../dialog/Dialog.tsx';
import type { ExportOutcome, ExportPhase, useSongExport } from './use-song-export.ts';
import './ExportButton.css';

type ExportButtonProps = {
  songExport: ReturnType<typeof useSongExport>;
  trackCount: number;
  unheardCount: number;
  isWaitingForAudio: boolean;
};

/** What the dialog's Export button says while an export is on its way. */
const PHASE_LABELS: Record<ExportPhase, string> = {
  rendering: 'Mixing…',
  encoding: 'Encoding…',
  writing: 'Saving…',
};

/**
 * Shows Export, and the dialog it opens.
 *
 * @param props - The component's props.
 * @param props.songExport - The export of the song, with what it is doing and what went wrong.
 * @param props.trackCount - How many tracks the song has.
 * @param props.unheardCount - How many of them mute and solo leave unheard now.
 * @param props.isWaitingForAudio - Whether some clips' audio is still being rendered.
 * @returns The button and its dialog.
 */
export function ExportButton({
  songExport,
  trackCount,
  unheardCount,
  isWaitingForAudio,
}: ExportButtonProps) {
  const [isOpen, setOpen] = useState(false);
  const [formatName, setFormatName] = useState(EXPORT_FORMATS[0]?.name ?? 'wav');
  const [isOnlyHeard, setOnlyHeard] = useState(true);
  const [clipped, setClipped] = useState<ExportOutcome | null>(null);
  const { phase, error } = songExport;
  const format = EXPORT_FORMATS.find((each) => each.name === formatName);
  const canChoosePlace = 'showSaveFilePicker' in window;
  function close(): void {
    if (phase) return;
    setOpen(false);
    setClipped(null);
    songExport.clearError();
  }
  async function exportSong(): Promise<void> {
    if (!format) return;
    setClipped(null);
    const outcome = await songExport.exportSong({
      format,
      isOnlyHeard: unheardCount > 0 && isOnlyHeard,
    });
    if (!outcome) return;
    if (outcome.decibelsOver === null) setOpen(false);
    else setClipped(outcome);
  }
  return (
    <>
      <button
        type="button"
        className="export-button"
        onClick={() => setOpen(true)}
        disabled={isWaitingForAudio}
        data-tooltip={
          isWaitingForAudio
            ? 'once every clip has its audio'
            : 'save the song as an audio file, as it plays now'
        }
      >
        Export
      </button>
      <Dialog isOpen={isOpen} labelId="export-dialog-title" onClose={close}>
        <div className="dialog-body export-dialog">
          <h2 id="export-dialog-title" className="export-dialog-title">
            Export as audio
          </h2>
          <p className="export-dialog-about">
            The song as the editor plays it now: its unsaved edits and the faders too.
          </p>
          <div className="export-dialog-group" role="radiogroup" aria-label="file type">
            <span className="export-dialog-label">File type</span>
            {EXPORT_FORMATS.map((each) => (
              <button
                key={each.name}
                type="button"
                role="radio"
                aria-checked={each.name === formatName}
                className={`export-dialog-option${each.name === formatName ? ' is-on' : ''}`}
                onClick={() => setFormatName(each.name)}
                disabled={phase !== null}
              >
                <span className="export-dialog-option-name">{each.label}</span>
                <span className="export-dialog-option-about">{each.about}</span>
              </button>
            ))}
          </div>
          {unheardCount > 0 && (
            <div className="export-dialog-group" role="radiogroup" aria-label="tracks">
              <span className="export-dialog-label">Tracks</span>
              {[
                {
                  isOn: true,
                  name: `The ${trackCount - unheardCount} heard`,
                  about: 'as mute and solo are set',
                },
                { isOn: false, name: `All ${trackCount}`, about: 'mute and solo left out' },
              ].map((each) => (
                <button
                  key={each.name}
                  type="button"
                  role="radio"
                  aria-checked={each.isOn === isOnlyHeard}
                  className={`export-dialog-option${each.isOn === isOnlyHeard ? ' is-on' : ''}`}
                  onClick={() => setOnlyHeard(each.isOn)}
                  disabled={phase !== null}
                >
                  <span className="export-dialog-option-name">{each.name}</span>
                  <span className="export-dialog-option-about">{each.about}</span>
                </button>
              ))}
            </div>
          )}
          {error && <p className="error">{error}</p>}
          {clipped && (
            <p className="export-dialog-clipped">
              {clipped.isChosen ? 'Saved' : 'Downloaded'} {clipped.name}, but it went{' '}
              {clipped.decibelsOver} dB over full scale and is clipped there. Lower the faders and
              export it again.
            </p>
          )}
          <p className="export-dialog-where">
            {canChoosePlace
              ? 'You choose where it is saved.'
              : 'It downloads: this browser cannot ask where to save it.'}
          </p>
          <div className="dialog-buttons">
            <button
              type="button"
              className="dialog-button"
              onClick={close}
              disabled={phase !== null}
            >
              {clipped ? 'Close' : 'Cancel'}
            </button>
            <button
              type="button"
              className="dialog-button is-yes"
              onClick={() => void exportSong()}
              disabled={phase !== null || !format}
            >
              {phase ? PHASE_LABELS[phase] : 'Export'}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
