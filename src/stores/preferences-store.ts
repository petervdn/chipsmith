/**
 * What this browser keeps of the page's settings, in localStorage (Zustand's persist; components
 * never touch storage, docs/adr/0017): the mute switch for testing and the look the page is
 * in (looks.ts).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The preferences and how to change them. */
type PreferencesStore = {
  /** The speakers muted, for testing; everything else plays on. */
  isMuted: boolean;
  /** The look the page is in (looks.ts). */
  lookId: string;
  setMuted: (isMuted: boolean) => void;
  setLookId: (lookId: string) => void;
};

/** Light or dark as the system is set, until the top bar's switch chooses. */
function getSystemLookId(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** The preferences store. */
export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      isMuted: false,
      lookId: getSystemLookId(),
      setMuted: (isMuted) => set({ isMuted }),
      setLookId: (lookId) => set({ lookId }),
    }),
    {
      name: 'chiptune.preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ isMuted, lookId }) => ({ isMuted, lookId }),
    },
  ),
);
