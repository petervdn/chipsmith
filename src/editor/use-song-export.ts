// Exporting the song being edited as audio: where it goes asked first (save-file.ts), then its mix
// rendered in the page (playback/mixdown.ts) as a WAV, encoded on the server when another type is
// chosen, and written; what it is doing and what went wrong kept for the dialog.
import { useState } from 'react';
import type { ExportFormat } from '../../shared/audio-export.ts';
import type { Clip } from '../../shared/clip.schema.ts';
import type { Song } from '../../shared/song.schema.ts';
import type { Loop } from '../playback/loop.ts';
import { renderMixdown } from '../playback/mixdown.ts';
import { getStretches } from '../playback/schedule.ts';
import { getPeak, getWavBytes } from '../playback/wav-file.ts';
import { useEncodeAudio } from '../queries/exports.ts';
import { getClipAudioUrl } from '../stores/player-store.ts';
import { chooseFileDestination } from './save-file.ts';
import { getDecibelsOver, getExportFileName, getExportTrackGains } from './song-export.ts';

/** What an export is doing: mixing, encoding on the server, or writing the file. */
export type ExportPhase = 'rendering' | 'encoding' | 'writing';

/** What came of an export that was written. */
export type ExportOutcome = {
  /** The file's name. */
  name: string;
  /** Whether it went to a place chosen in the Save dialog; false when it was downloaded. */
  isChosen: boolean;
  /** How far the mix went over full scale, where it was clipped; null when it did not. */
  decibelsOver: number | null;
};

/** The song to export, as the editor has it. */
type SongExportArguments = {
  song: Song;
  clips: Clip[];
  unheardTrackIds: string[];
  loop: Loop | null;
};

/**
 * Returns what the export dialog needs: the export, what it is doing and what went wrong.
 *
 * @param songExport - The song to export.
 * @param songExport.song - The song with its tracks as edited, saved or not.
 * @param songExport.clips - The clips its blocks play.
 * @param songExport.unheardTrackIds - The tracks mute and solo leave unheard now.
 * @param songExport.loop - The loop drawn on the timeline, which can be exported instead, or null.
 * @returns The export, its phase and its error.
 */
export function useSongExport({ song, clips, unheardTrackIds, loop }: SongExportArguments) {
  const [phase, setPhase] = useState<ExportPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: encode } = useEncodeAudio();
  /**
   * Exports the song: asks where it goes, then mixes, encodes and writes it.
   *
   * @param choice - What was chosen in the dialog.
   * @param choice.format - The file type.
   * @param choice.isOnlyHeard - Whether the tracks not heard now are left out.
   * @param choice.loopTimes - How many times the loop plays, or null for the whole song.
   * @returns What came of it, or null when it was cancelled or failed.
   */
  async function exportSong({
    format,
    isOnlyHeard,
    loopTimes,
  }: {
    format: ExportFormat;
    isOnlyHeard: boolean;
    loopTimes: number | null;
  }): Promise<ExportOutcome | null> {
    setError(null);
    const name = getExportFileName(song.title, format);
    try {
      const destination = await chooseFileDestination(name, format);
      if (!destination) return null;
      setPhase('rendering');
      const mix = await renderMixdown({
        stretches: getStretches(song, clips),
        getUrl: getClipAudioUrl,
        trackGains: getExportTrackGains(song.tracks, isOnlyHeard ? unheardTrackIds : []),
        loop: loop && loopTimes ? { ...loop, times: loopTimes } : null,
      });
      const channels = [...Array(mix.numberOfChannels).keys()].map((channel) =>
        mix.getChannelData(channel),
      );
      const wav = getWavBytes(channels, mix.sampleRate);
      let file = new Blob([wav], { type: format.mediaType });
      if (format.ffmpegArgs.length > 0) {
        setPhase('encoding');
        file = await encode({ wav, format });
      }
      setPhase('writing');
      await destination.write(file);
      return {
        name,
        isChosen: destination.isChosen,
        decibelsOver: getDecibelsOver(getPeak(channels)),
      };
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
      return null;
    } finally {
      setPhase(null);
    }
  }
  return { phase, error, exportSong, clearError: () => setError(null) };
}
