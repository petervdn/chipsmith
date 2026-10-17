// The time now, kept current every minute, so a list grouped by time moves its items on.
import { useEffect, useState } from 'react';

/** Milliseconds between updates of the time. */
const EVERY = 60 * 1000;

/**
 * Keeps the time now.
 *
 * @returns The time now in milliseconds since 1970, updated every minute.
 */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), EVERY);
    return () => clearInterval(timer);
  }, []);
  return now;
}
