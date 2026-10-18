/**
 * The jobs from the server, read every second while one runs and every five when none does; sending
 * a prompt, or one for takes of a clip; and the songs and clips read again whenever a job has made
 * another song or take.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { JobRequest } from '../../shared/api-requests.schema.ts';
import type { Job, TakesTarget } from '../../shared/job.schema.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';
import type { SentHarmony } from '../../shared/harmony.schema.ts';
import type { SentStructure } from '../../shared/structure.schema.ts';

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
  return phase !== 'done' && phase !== 'failed' && phase !== 'cancelled';
}

/**
 * Reads the jobs from the server, every second while one runs and every five when none does, and
 * reads the songs list and the clips again whenever a job has made another song or take.
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
    void queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'clips' }) });
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
 * Takes several jobs that are over off the Jobs page, one after another; the server's last answer
 * becomes the cached jobs.
 *
 * @returns The mutation, called with the jobs' ids.
 */
export function useRemoveJobs() {
  return useMutation({
    mutationFn: async (jobIds: string[]) => {
      let jobs: Job[] | null = null;
      for (const jobId of jobIds) {
        jobs = await sendJson<Job[]>(`/api/jobs/${encodeURIComponent(jobId)}`, 'DELETE', null);
      }
      return jobs;
    },
    onSuccess: (jobs) => {
      if (jobs) queryClient.setQueryData(getQueryKey({ type: 'jobs' }), jobs);
    },
  });
}

/**
 * Cancels a job on its way; the server's list becomes the cached one.
 *
 * @returns The mutation, called with the job's id.
 */
export function useCancelJob() {
  return useMutation({
    mutationFn: (jobId: string) =>
      sendJson<Job[]>(`/api/jobs/${encodeURIComponent(jobId)}/cancel`, 'POST', {}),
    onSuccess: (jobs) => queryClient.setQueryData(getQueryKey({ type: 'jobs' }), jobs),
  });
}

/**
 * Sends a prompt to the server as a new job; the jobs are read again at once.
 *
 * @returns The mutation, called with the `prompt`, the song it is sent again from (`fromSong`, or
 * null), the ids of the style guides sent with it (`guideIds`), the structure and the harmony sent
 * with it (`structure`, `harmony`, each or null), and how many songs to make (`songCount`).
 */
export function useSendPrompt() {
  return useMutation({
    mutationFn: ({
      prompt,
      fromSong,
      guideIds,
      structure,
      harmony,
      songCount,
    }: {
      prompt: string;
      fromSong: string | null;
      guideIds: string[];
      structure: SentStructure | null;
      harmony: SentHarmony | null;
      songCount: number;
    }) =>
      sendJson<Job>('/api/jobs', 'POST', {
        prompt,
        fromSong,
        guideIds,
        structure,
        harmony,
        songCount,
      } satisfies JobRequest),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'jobs' }) }),
  });
}

/**
 * Sends a prompt for takes of a clip in a song as a new job (docs/adr/0037); the jobs are read again
 * at once.
 *
 * @returns The mutation, called with the `prompt`, the clip and the song (`takesOf`) and how many
 * takes to make (`takeCount`).
 */
export function useSendTakes() {
  return useMutation({
    mutationFn: ({
      prompt,
      takesOf,
      takeCount,
    }: {
      prompt: string;
      takesOf: TakesTarget;
      takeCount: number;
    }) =>
      sendJson<Job>('/api/jobs', 'POST', {
        prompt,
        takesOf,
        songCount: takeCount,
      } satisfies JobRequest),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'jobs' }) }),
  });
}
