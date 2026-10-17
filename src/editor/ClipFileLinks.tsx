// A clip's .fur file, to look at: opened in Furnace on the computer the app runs on (a copy, so the
// clip never changes), downloaded, or read as tracker text in a tab of its own.
import { useOpenClipInFurnace } from '../queries/clips.ts';
import './ClipFileLinks.css';

type ClipFileLinksProps = { clipId: string };

/**
 * Shows the ways to look at a clip's .fur file.
 *
 * @param props - The component's props.
 * @param props.clipId - The clip.
 * @returns The links' element.
 */
export function ClipFileLinks({ clipId }: ClipFileLinksProps) {
  const { mutate: openInFurnace, isPending, isSuccess, error, reset } = useOpenClipInFurnace();
  const media = `/media/clips/${encodeURIComponent(clipId)}`;
  return (
    <div className="clip-file-links">
      <span className="clip-file-links-label">.fur</span>
      <button
        type="button"
        onClick={() => openInFurnace(clipId)}
        onBlur={reset}
        disabled={isPending}
        data-tooltip="open a copy in Furnace on the computer the app runs on; saving it there changes nothing here"
      >
        {isPending ? 'Opening…' : isSuccess ? 'Opened in Furnace' : 'Open in Furnace'}
      </button>
      <a href={`${media}/source.fur`} download data-tooltip="save the .fur file">
        Download
      </a>
      <a
        href={`${media}/source.txt`}
        target="_blank"
        rel="noreferrer"
        data-tooltip="read it as the tracker shows it: every order's patterns side by side"
      >
        View as text
      </a>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
