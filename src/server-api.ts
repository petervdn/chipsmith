/** Asking the app's server (server/api.ts): reading a route as its type, and sending a change. */
import { useCallback, useEffect, useState } from 'react';

/** What a read gives while it loads, once it has the answer, or when it failed. */
export type Loaded<Data> = { data: Data | null; error: string | null; reload: () => void };

/** Reads a route of the server, again whenever `reload` is called or the path changes. */
export function useServerData<Data>(path: string): Loaded<Data> {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const reload = useCallback(() => setCount((previous) => previous + 1), []);
  useEffect(() => {
    let isCurrent = true;
    requestJson<Data>(path).then(
      (answer) => {
        if (!isCurrent) return;
        setData(answer);
        setError(null);
      },
      (failure: unknown) => {
        if (isCurrent) setError(failure instanceof Error ? failure.message : String(failure));
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [path, count]);
  return { data, error, reload };
}

/** Sends a change to a route and gives back what the server answers. */
export function sendChange<Answer>(path: string, change: unknown): Promise<Answer> {
  return requestJson<Answer>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(change),
  });
}

async function requestJson<Answer>(path: string, init?: RequestInit): Promise<Answer> {
  const response = await fetch(path, init);
  const answer: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof answer === 'object' && answer !== null && 'error' in answer
        ? String(answer.error)
        : response.statusText;
    throw new Error(message);
  }
  return parseAnswer<Answer>(answer);
}

/** The server's answer is the route's type by contract (shared/api.types.ts). */
function parseAnswer<Answer>(answer: unknown): Answer {
  // eslint-disable-next-line typescript/consistent-type-assertions -- the server's routes are typed by shared/api.types.ts; checking each answer again would repeat server/model-checks.ts
  return answer as Answer;
}
