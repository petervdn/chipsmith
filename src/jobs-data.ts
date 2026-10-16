/**
 * The jobs as the page keeps them: read from the server every second while one runs, every five
 * when none does; and sending a prompt, which makes a job at once.
 */
import { useEffect, useState } from 'react';
import type { Job } from '../shared/job.types.ts';

/** Milliseconds between reads while a job runs, and while none does. */
const RUNNING_INTERVAL = 1000;
const IDLE_INTERVAL = 5000;

/** Whether a job is still on its way. */
export function isJobRunning({ phase }: Job): boolean {
  return phase !== 'done' && phase !== 'failed';
}

/** The jobs the server lists, kept current; `refresh` reads them again now. */
export function useJobs(): { jobs: Job[]; refresh: () => void } {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [count, setCount] = useState(0);
  const isAnyRunning = jobs.some(isJobRunning);
  useEffect(() => {
    let isCurrent = true;
    async function read(): Promise<void> {
      try {
        const response = await fetch('/api/jobs');
        const answer: Job[] = await response.json();
        if (isCurrent) setJobs(answer);
      } catch {
        /* the next read tries again */
      }
    }
    void read();
    const timer = setInterval(() => void read(), isAnyRunning ? RUNNING_INTERVAL : IDLE_INTERVAL);
    return () => {
      isCurrent = false;
      clearInterval(timer);
    };
  }, [isAnyRunning, count]);
  return { jobs, refresh: () => setCount((previous) => previous + 1) };
}

/** Sends a prompt; the server makes its job at once. */
export async function sendPrompt(prompt: string): Promise<void> {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const answer: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof answer === 'object' && answer !== null && 'error' in answer
        ? String(answer.error)
        : '';
    throw new Error(message || response.statusText);
  }
}
