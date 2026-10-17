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

/**
 * Tells whether a job is still on its way.
 *
 * @param job - The job.
 * @param job.phase - The phase it is in.
 * @returns True until it is done or has failed.
 */
export function isJobRunning({ phase }: Job): boolean {
  return phase !== 'done' && phase !== 'failed';
}

/**
 * Reads the jobs from the server, every second while one runs and every five when none does, and
 * reads the songs list again whenever a job has made another song.
 *
 * @returns Every job, newest first; none until they are read.
 */
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

/**
 * Takes a job that is over off the Jobs page; the server's answer becomes the cached jobs.
 *
 * @returns The mutation, called with the job's id.
 */
export function useRemoveJob() {
  return useMutation({
    mutationFn: (jobId: string) =>
      sendJson<Job[]>(`/api/jobs/${encodeURIComponent(jobId)}`, 'DELETE', null),
    onSuccess: (jobs) => queryClient.setQueryData(getQueryKey({ type: 'jobs' }), jobs),
  });
}

/**
 * Sends a prompt to the server as a new job; the jobs are read again at once.
 *
 * @returns The mutation, called with the `prompt`, the song it is sent again from (`fromSong`, or
 * null) and the ids of the style guides sent with it (`guideIds`).
 */
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
