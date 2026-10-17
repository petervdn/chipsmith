/**
 * Which page the address is, and moving between them without reloading. Pages: `/` home,
 * `/songs` the songs list, `/songs/<id>` one song, `/clips` the clip pool, `/guides` the style guides, `/new` a prompt, `/jobs`
 * every prompt sent. Knows nothing of what a page shows.
 */
import { useEffect, useState } from 'react';

/** A page and what it is of. */
export type Route =
  | { page: 'home' }
  | { page: 'songs' }
  | { page: 'song'; songId: string }
  | { page: 'clips' }
  | { page: 'guides' }
  | { page: 'new' }
  | { page: 'jobs' };

/** The route of an address's path (a query after it is not the route's). */
export function getRoute(address: string): Route {
  const path = address.split('?')[0] ?? '';
  const song = /^\/songs\/([^/]+)\/?$/.exec(path);
  if (song?.[1]) return { page: 'song', songId: decodeURIComponent(song[1]) };
  if (/^\/songs\/?$/.test(path)) return { page: 'songs' };
  if (/^\/clips\/?$/.test(path)) return { page: 'clips' };
  if (/^\/guides\/?$/.test(path)) return { page: 'guides' };
  if (/^\/new\/?$/.test(path)) return { page: 'new' };
  if (/^\/jobs\/?$/.test(path)) return { page: 'jobs' };
  return { page: 'home' };
}

/** Goes to a path of the app, keeping it in the browser's history. */
export function navigate(path: string): void {
  if (path === window.location.pathname + window.location.search) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** The current route, following back, forward and links within the app. */
export function useRoute(): Route {
  const [path, setPath] = useState(window.location.pathname + window.location.search);
  useEffect(() => {
    function followHistory(): void {
      setPath(window.location.pathname + window.location.search);
    }
    function followLink(event: MouseEvent): void {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      const href = link?.getAttribute('href');
      if (!href?.startsWith('/') || link?.target) return;
      event.preventDefault();
      navigate(href);
    }
    window.addEventListener('popstate', followHistory);
    document.addEventListener('click', followLink);
    return () => {
      window.removeEventListener('popstate', followHistory);
      document.removeEventListener('click', followLink);
    };
  }, []);
  return getRoute(path);
}
