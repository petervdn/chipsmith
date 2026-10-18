/**
 * The prompt on a selected block's clip: what is written, how many takes, sending it as a job of
 * takes (docs/adr/0037), and the jobs of takes of this clip still on their way.
 */
import { useState } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { isJobRunning, useJobs, useSendTakes } from '../queries/jobs.ts';
import { addAsk } from './clip-prompt.ts';

/** What the prompt on a clip gives its component. */
export type ClipPrompt = {
  text: string;
  setText: (text: string) => void;
  /** Adds a quick ask to the prompt. */
  addQuickAsk: (ask: string) => void;
  takeCount: number;
  setTakeCount: (takeCount: number) => void;
  /** Sends the prompt, then empties it. */
  send: () => void;
  isSending: boolean;
  /** Why the last send failed, or null. */
  error: string | null;
  /** The jobs making takes of this clip, on their way. */
  runningJobs: Job[];
};

/**
 * Keeps the prompt on a clip and sends it as takes of the clip in the song.
 *
 * @param target - What the takes are of.
 * @param target.clipId - The clip.
 * @param target.songId - The song it is asked in.
 * @returns The prompt's text and count, their setters, send, and the jobs on their way.
 */
export function useClipPrompt({ clipId, songId }: { clipId: string; songId: string }): ClipPrompt {
  const [text, setText] = useState('');
  const [takeCount, setTakeCount] = useState(3);
  const { mutate, isPending, error } = useSendTakes();
  const runningJobs = useJobs().filter(
    (job) => job.takesOf?.clip === clipId && job.takesOf.song === songId && isJobRunning(job),
  );
  function send(): void {
    const prompt = text.trim();
    if (!prompt) return;
    mutate(
      { prompt, takesOf: { clip: clipId, song: songId }, takeCount },
      { onSuccess: () => setText('') },
    );
  }
  return {
    text,
    setText,
    addQuickAsk: (ask) => setText((written) => addAsk(written, ask)),
    takeCount,
    setTakeCount,
    send,
    isSending: isPending,
    error: error ? error.message : null,
    runningJobs,
  };
}
