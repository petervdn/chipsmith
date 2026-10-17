/**
 * The jobs from the server, read every second while one runs and every five when none does; sending
 * a prompt; and the songs list read again whenever a job has made another song.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';

/** Milliseconds between reads while a job runs, and while none does. */
const RUNNING_INTERVAL = 1000;
const IDLE_INTERVAL = 5000;

/** Whether a job is still on its way. */
export function isJobRunning({ phase }: Job): boolean {
  return phase !== 'done' && phase !== 'failed';
}

/** The jobs the server lists (running ones and those of the last hour). */
export function useJobs(): Job[] {
  const { data } = useQuery({
    queryKey: getQueryKey({ type: 'jobs' }),
    queryFn: () => requestJson<Job[]>('/api/jobs'),
    refetchInterval: (query) =>
      (query.state.data ?? []).some(isJobRunning) ? RUNNING_INTERVAL : IDLE_INTERVAL,
  });
  const jobs = data ?? [];
  const madeCount = jobs.flatMap((job) => job.songs).filter((song) => song.songId).length;
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'songs' }), exact: true });
  }, [madeCount]);
  return jobs;
}

/** Sends a prompt (with the song it is sent again from, if so); the jobs are read again at once. */
export function useSendPrompt() {
  return useMutation({
    mutationFn: ({
      prompt,
      fromSong,
      guideIds,
    }: {
      prompt: string;
      fromSong: string | null;
      guideIds: string[];
    }) => sendJson<Job>('/api/jobs', 'POST', { prompt, fromSong, guideIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'jobs' }) }),
  });
}
