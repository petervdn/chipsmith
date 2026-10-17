// The browser tab's title: the page's name, then the app's.
import { useEffect } from 'react';

const APP_NAME = 'chipsmith';

/** Sets the tab's title to `pageName – chipsmith` while the page is open. */
export function usePageTitle(pageName: string) {
  useEffect(() => {
    document.title = `${pageName} – ${APP_NAME}`;
  }, [pageName]);
}
