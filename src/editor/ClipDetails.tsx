// The selected clip's section of the details, for a clip selected in the song's clips or the clip of
// the selected block: what it is and its facts, its .fur file to look at, its takes to put in its
// place, quick changes and the prompt for more takes (docs/adr/0037).
import type { Clip } from '../../shared/clip.schema.ts';
import { getChannelName, isPitchedChannel } from '../../shared/clip-channels.ts';
import { getClipLabel } from '../../shared/clip-label.ts';
import { formatSeconds } from '../format.ts';
import { ClipFileLinks } from './ClipFileLinks.tsx';
import { ClipOperations } from './ClipOperations.tsx';
import { ClipPrompt } from './ClipPrompt.tsx';
import { ClipTakes } from './ClipTakes.tsx';
import { DetailsSection } from './DetailsSection.tsx';
import './ClipDetails.css';

type ClipDetailsProps = {
  songId: string;
  clip: Clip;
  versions: Clip[];
  blockCount: number;
  onUseVersion: (clipId: string) => void;
  onReplaceClip: (fromClipId: string, toClipId: string) => void;
};

/**
 * Shows a clip's section: its facts, its file, its takes and the ways to make more.
 *
 * @param props - The component's props.
 * @param props.songId - The id of the song being edited.
 * @param props.clip - The clip.
 * @param props.versions - The versions of the clip, oldest first.
 * @param props.blockCount - How many blocks of the song play it.
 * @param props.onUseVersion - Called with a take's id to put it in the clip's place.
 * @param props.onReplaceClip - Called with a clip's id and the one that replaces it (a take deleted
 *   or updated), to put it in the draft's blocks.
 * @returns The section element.
 */
export function ClipDetails({
  songId,
  clip,
  versions,
  blockCount,
  onUseVersion,
  onReplaceClip,
}: ClipDetailsProps) {
  return (
    <DetailsSection kind="clip" title={getClipLabel(clip)}>
      <p className="clip-details-facts">
        {clip.id} · {Math.round(clip.bpm)} bpm · {formatSeconds(clip.seconds)}
        {clip.chips.length > 0 && ` · ${clip.chips.join(' + ')}`}
        {clip.channels.length > 0 &&
          ` · ${clip.channels.length === 1 ? 'channel' : `${clip.channels.length} channels`}: ${clip.channels.map((channel) => getChannelName(clip.chips, channel)).join(', ')}`}{' '}
        · made {clip.created.slice(0, 10)} · in {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
      </p>
      <ClipFileLinks clipId={clip.id} />
      {versions.length > 1 && (
        <ClipTakes
          versions={versions}
          currentClipId={clip.id}
          songId={songId}
          onUse={onUseVersion}
          onReplaceClip={onReplaceClip}
        />
      )}
      {clip.channels.some((channel) => isPitchedChannel(clip.chips, channel)) && (
        <ClipOperations
          clipId={clip.id}
          songId={songId}
          isTake={clip.parent?.relation === 'variation'}
          onMade={onUseVersion}
          onReplaceClip={onReplaceClip}
        />
      )}
      <ClipPrompt clipId={clip.id} songId={songId} />
    </DetailsSection>
  );
}
