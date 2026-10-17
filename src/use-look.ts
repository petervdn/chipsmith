/**
 * The look the page is in: the one kept in the preferences, put on <html> as `data-look` for
 * style.css, and the steps to the one before and after it.
 */
import { useLayoutEffect } from 'react';
import { getLook, getNextLook } from './looks.ts';
import { usePreferencesStore } from './stores/preferences-store.ts';

/** The look, and how to step to the one before or after. */
export function useLook() {
  const lookId = usePreferencesStore((state) => state.lookId);
  const setLookId = usePreferencesStore((state) => state.setLookId);
  const look = getLook(lookId);
  useLayoutEffect(() => {
    document.documentElement.dataset['look'] = look.id;
  }, [look.id]);
  return {
    look,
    showPreviousLook: () => setLookId(getNextLook({ lookId: look.id, step: -1 }).id),
    showNextLook: () => setLookId(getNextLook({ lookId: look.id, step: 1 }).id),
  };
}
