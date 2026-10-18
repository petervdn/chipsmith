// Export, among the song's actions beside its title (put there by SongEditor.tsx): it opens a
// dialog to export the song as audio, as the editor plays it now (its unsaved edits and faders
// too): the whole song or the loop drawn on the timeline (up to MOST_LOOP_TIMES times, offered but
// off while there is none), the file type, the tracks when some are muted or soloed away, and Export, which asks where
// the file goes where the browser can (use-song-export.ts). A mix that clipped is said before the
// dialog closes.
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { EXPORT_FORMATS } from '../../shared/audio-export.ts';
import { Dialog } from '../dialog/Dialog.tsx';
import type { LoopRange } from './loop-range.ts';
import { getExportSizeText } from './song-export.ts';
import type { ExportOutcome, ExportPhase, useSongExport } from './use-song-export.ts';
import './ExportButton.css';

type ExportButtonProps = {
  songExport: ReturnType<typeof useSongExport>;
  trackCount: number;
  unheardCount: number;
  loopRange: LoopRange | null;
  isWaitingForAudio: boolean;
};

/** The most times the loop can be exported, back to back. */
const MOST_LOOP_TIMES = 5;

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
 * @param props.loopRange - The loop drawn on the timeline, in bars, or null when none is.
 * @param props.isWaitingForAudio - Whether some clips' audio is still being rendered.
 * @returns The button and its dialog.
 */
export function ExportButton({
  songExport,
  trackCount,
  unheardCount,
  loopRange,
  isWaitingForAudio,
}: ExportButtonProps) {
  const [isOpen, setOpen] = useState(false);
  const [formatName, setFormatName] = useState(EXPORT_FORMATS[0]?.name ?? 'wav');
  const [isOnlyHeard, setOnlyHeard] = useState(true);
  const [isLoopChosen, setLoopChosen] = useState(false);
  const [loopTimes, setLoopTimes] = useState(1);
  const [clipped, setClipped] = useState<ExportOutcome | null>(null);
  const { phase, error } = songExport;
  const format = EXPORT_FORMATS.find((each) => each.name === formatName);
  const isLoop = loopRange !== null && isLoopChosen;
  const seconds = songExport.getSeconds(isLoop ? loopTimes : null);
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
      loopTimes: isLoop ? loopTimes : null,
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
          <fieldset className="export-dialog-group" disabled={phase !== null}>
            <legend className="export-dialog-label">Length</legend>
            <label className="export-dialog-option">
              <input
                type="radio"
                name="export-length"
                checked={!isLoop}
                onChange={() => setLoopChosen(false)}
              />
              <span className="export-dialog-option-name">The whole song</span>
              <span className="export-dialog-option-about">from its start to its end</span>
            </label>
            <label className={`export-dialog-option${loopRange ? '' : ' is-off'}`}>
              <input
                type="radio"
                name="export-length"
                checked={isLoop}
                onChange={() => setLoopChosen(true)}
                disabled={!loopRange}
              />
              <span className="export-dialog-option-name">The loop</span>
              {loopRange ? (
                <span className="export-dialog-option-about export-dialog-loop">
                  bars {loopRange.startBar + 1}–{loopRange.endBar},
                  <span className="export-dialog-times">
                    <button
                      type="button"
                      onClick={() => {
                        setLoopChosen(true);
                        setLoopTimes(Math.max(1, loopTimes - 1));
                      }}
                      disabled={loopTimes <= 1}
                      data-tooltip="once fewer"
                      aria-label="once fewer"
                    >
                      <Minus />
                    </button>
                    <span className="export-dialog-times-number">{loopTimes}×</span>
                    <button
                      type="button"
                      onClick={() => {
                        setLoopChosen(true);
                        setLoopTimes(Math.min(MOST_LOOP_TIMES, loopTimes + 1));
                      }}
                      disabled={loopTimes >= MOST_LOOP_TIMES}
                      data-tooltip="once more"
                      aria-label="once more"
                    >
                      <Plus />
                    </button>
                  </span>
                </span>
              ) : (
                <span className="export-dialog-option-about">draw one on the timeline first</span>
              )}
            </label>
          </fieldset>
          <fieldset className="export-dialog-group" disabled={phase !== null}>
            <legend className="export-dialog-label">File type</legend>
            {EXPORT_FORMATS.map((each) => (
              <label key={each.name} className="export-dialog-option">
                <input
                  type="radio"
                  name="export-format"
                  checked={each.name === formatName}
                  onChange={() => setFormatName(each.name)}
                />
                <span className="export-dialog-option-name">{each.label}</span>
                <span className="export-dialog-option-about">
                  {each.about} · about {getExportSizeText(each, seconds)}
                </span>
              </label>
            ))}
          </fieldset>
          {unheardCount > 0 && (
            <fieldset className="export-dialog-group" disabled={phase !== null}>
              <legend className="export-dialog-label">Tracks</legend>
              {[
                {
                  isOn: true,
                  name: `The ${trackCount - unheardCount} heard`,
                  about: 'as mute and solo are set',
                },
                { isOn: false, name: `All ${trackCount}`, about: 'mute and solo left out' },
              ].map((each) => (
                <label key={each.name} className="export-dialog-option">
                  <input
                    type="radio"
                    name="export-tracks"
                    checked={each.isOn === isOnlyHeard}
                    onChange={() => setOnlyHeard(each.isOn)}
                  />
                  <span className="export-dialog-option-name">{each.name}</span>
                  <span className="export-dialog-option-about">{each.about}</span>
                </label>
              ))}
            </fieldset>
          )}
          {error && <p className="error">{error}</p>}
          {clipped && (
            <p className="export-dialog-clipped">
              {clipped.isChosen ? 'Saved' : 'Downloaded'} {clipped.name}, but it went{' '}
              {clipped.decibelsOver} dB over full scale and is clipped there. Lower the faders and
              export it again.
            </p>
          )}
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
