// The browser tab's title: the page's name, then the app's, in lower case like the app's name.
import { useEffect } from 'react';

const APP_NAME = 'chipsmith';

/**
 * Sets the browser tab's title to `pagename – chipsmith` while the page is open: the page's name in
 * lower case, as the app's name is written.
 *
 * @param pageName - The name of the page shown.
 */
export function usePageTitle(pageName: string) {
  useEffect(() => {
    document.title = `${pageName.toLocaleLowerCase()} – ${APP_NAME}`;
  }, [pageName]);
}
