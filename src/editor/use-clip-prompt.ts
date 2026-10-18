/**
 * The prompt on a selected block's clip: what is written, how many takes, the style guides chosen
 * to go with it (the song's own at first, shown and changeable), sending it as a job of takes
 * (docs/adr/0037), and the jobs of takes of this clip still on their way.
 */
import { useState } from 'react';
import type { Guide } from '../../shared/guide.schema.ts';
import type { Job } from '../../shared/job.schema.ts';
import { useGuideChoice } from '../guides/use-guide-choice.ts';
import { isJobRunning, useJobs, useSendTakes } from '../queries/jobs.ts';
import { useSong } from '../queries/songs.ts';
import { addAsk } from './clip-prompt.ts';

/** How many takes the prompt asks for until the count is changed. */
const FIRST_TAKE_COUNT = 1;

/** What the prompt on a clip gives its component. */
export type ClipPrompt = {
  text: string;
  setText: (text: string) => void;
  /** Adds a quick ask to the prompt. */
  addQuickAsk: (ask: string) => void;
  takeCount: number;
  setTakeCount: (takeCount: number) => void;
  /** Every style guide, the ids of those chosen to go along, and toggling one. */
  guides: Guide[];
  chosenGuideIds: string[];
  toggleGuide: (guideId: string) => void;
  /** Sends the prompt, then empties it. */
  send: () => void;
  isSending: boolean;
  /** Why the last send failed, or null. */
  error: string | null;
  /** The jobs making takes of this clip, on their way. */
  runningJobs: Job[];
};

/**
 * Keeps the prompt on a clip, and the style guides chosen with it (the song's own at first), and
 * sends it as takes of the clip in the song.
 *
 * @param target - What the takes are of.
 * @param target.clipId - The clip.
 * @param target.songId - The song it is asked in.
 * @returns The prompt's text, count and guides, their setters, send, and the jobs on their way.
 */
export function useClipPrompt({ clipId, songId }: { clipId: string; songId: string }): ClipPrompt {
  const [text, setText] = useState('');
  const [takeCount, setTakeCount] = useState(FIRST_TAKE_COUNT);
  const songGuideIds = useSong(songId).data?.song.guides.map((guide) => guide.id) ?? [];
  const { guides, chosenIds, toggleGuide, resetChoice } = useGuideChoice(songGuideIds);
  const { mutate, isPending, error } = useSendTakes();
  const runningJobs = useJobs().filter(
    (job) => job.takesOf?.clip === clipId && job.takesOf.song === songId && isJobRunning(job),
  );
  function send(): void {
    const prompt = text.trim();
    if (!prompt) return;
    mutate(
      { prompt, takesOf: { clip: clipId, song: songId }, takeCount, guideIds: chosenIds },
      {
        onSuccess: () => {
          setText('');
          resetChoice();
        },
      },
    );
  }
  return {
    text,
    setText,
    addQuickAsk: (ask) => setText((written) => addAsk(written, ask)),
    takeCount,
    setTakeCount,
    guides,
    chosenGuideIds: chosenIds,
    toggleGuide,
    send,
    isSending: isPending,
    error: error ? error.message : null,
    runningJobs,
  };
}
