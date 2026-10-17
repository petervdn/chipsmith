/**
 * What this browser keeps of the page's settings, in localStorage (Zustand's persist; components
 * never touch storage, docs/adr/0017): the mute switch for testing, and the job cards hidden on New.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The preferences and how to change them. */
type PreferencesStore = {
  /** The speakers muted, for testing; everything else plays on. */
  isMuted: boolean;
  /** The jobs whose cards were hidden on the New page. */
  hiddenJobIds: string[];
  setMuted: (isMuted: boolean) => void;
  hideJob: (jobId: string) => void;
};

/** The preferences store. */
export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      isMuted: false,
      hiddenJobIds: [],
      setMuted: (isMuted) => set({ isMuted }),
      hideJob: (jobId) => set(({ hiddenJobIds }) => ({ hiddenJobIds: [...hiddenJobIds, jobId] })),
    }),
    {
      name: 'chiptune.preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ isMuted, hiddenJobIds }) => ({ isMuted, hiddenJobIds }),
    },
  ),
);
