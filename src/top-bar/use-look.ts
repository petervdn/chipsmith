/**
 * The look the page is in, light or dark: the one kept in the preferences, put on <html> as
 * `data-look` for style.css, and the step to the other one.
 */
import { useLayoutEffect } from 'react';
import { getLook, getNextLook } from './looks.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';

/** The look, and how to switch to the other one. */
export function useLook() {
  const lookId = usePreferencesStore((state) => state.lookId);
  const setLookId = usePreferencesStore((state) => state.setLookId);
  const look = getLook(lookId);
  useLayoutEffect(() => {
    document.documentElement.dataset['look'] = look.id;
  }, [look.id]);
  return {
    look,
    showNextLook: () => setLookId(getNextLook({ lookId: look.id, step: 1 }).id),
  };
}
