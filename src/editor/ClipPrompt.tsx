// The prompt on a selected block's clip: a box to say what to change, quick asks a tap adds, how
// many takes, and Send; then the jobs making takes of it, on their way (docs/adr/0037). Its takes
// are listed with the clip's versions.
import { Minus, Plus } from 'lucide-react';
import { MOST_TAKES, QUICK_ASKS } from './clip-prompt.ts';
import { useClipPrompt } from './use-clip-prompt.ts';
import '../jobs/jobs.css';
import './ClipPrompt.css';

type ClipPromptProps = { clipId: string; songId: string };

/**
 * Shows the prompt on a clip, and the jobs making takes of it.
 *
 * @param props - The component's props.
 * @param props.clipId - The clip the takes are of.
 * @param props.songId - The song they are asked in.
 * @returns The clip prompt element.
 */
export function ClipPrompt({ clipId, songId }: ClipPromptProps) {
  const prompt = useClipPrompt({ clipId, songId });
  const { takeCount } = prompt;
  return (
    <form
      className="clip-prompt"
      onSubmit={(event) => {
        event.preventDefault();
        prompt.send();
      }}
    >
      <h3 className="clip-prompt-title">Change this clip</h3>
      <textarea
        className="clip-prompt-text"
        value={prompt.text}
        onChange={(event) => prompt.setText(event.target.value)}
        placeholder="What to change: “a walking bass”, “three new versions of this bassline”…"
        rows={2}
      />
      <div className="clip-prompt-asks">
        {QUICK_ASKS.map((ask) => (
          <button
            key={ask}
            type="button"
            className="clip-prompt-ask"
            onClick={() => prompt.addQuickAsk(ask)}
          >
            {ask}
          </button>
        ))}
      </div>
      <div className="clip-prompt-send-row">
        <span className="clip-prompt-count" aria-label="how many takes">
          <button
            type="button"
            onClick={() => prompt.setTakeCount(Math.max(1, takeCount - 1))}
            disabled={takeCount <= 1}
            data-tooltip="one take fewer"
            aria-label="one take fewer"
          >
            <Minus />
          </button>
          <span className="clip-prompt-count-number">{takeCount}</span>
          <button
            type="button"
            onClick={() => prompt.setTakeCount(Math.min(MOST_TAKES, takeCount + 1))}
            disabled={takeCount >= MOST_TAKES}
            data-tooltip="one take more"
            aria-label="one take more"
          >
            <Plus />
          </button>
        </span>
        <button
          type="submit"
          className="clip-prompt-send"
          disabled={!prompt.text.trim() || prompt.isSending}
        >
          {prompt.isSending
            ? 'Sending…'
            : `Make ${takeCount} ${takeCount === 1 ? 'take' : 'takes'}`}
        </button>
      </div>
      {prompt.error && <p className="error">{prompt.error}</p>}
      {prompt.runningJobs.map((job) => (
        <p key={job.id} className="clip-prompt-running">
          <span className="jobs-spinner" aria-hidden="true" />
          {job.songCount ?? 1} {job.songCount === 1 ? 'take' : 'takes'} on their way ({job.phase}) ·{' '}
          <a href="/jobs">Jobs</a>
        </p>
      ))}
    </form>
  );
}
