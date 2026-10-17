/**
 * What this browser keeps of the page's settings, in localStorage (Zustand's persist; components
 * never touch storage, docs/adr/0017): the mute switch for testing, the look the page is in
 * (looks.ts), the player's volume, and whether the editor follows the playhead.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LOUDEST_DB } from '../player/volume.ts';

/** The preferences and how to change them. */
type PreferencesStore = {
  /** The speakers muted, for testing; everything else plays on. */
  isMuted: boolean;
  /** The look the page is in (looks.ts). */
  lookId: string;
  /** The player's volume, in decibels (player/volume.ts). */
  volume: number;
  /** Whether the editor's timeline scrolls along with the playhead while the song plays. */
  isFollowingPlayhead: boolean;
  setMuted: (isMuted: boolean) => void;
  setLookId: (lookId: string) => void;
  setVolume: (volume: number) => void;
  setFollowingPlayhead: (isFollowingPlayhead: boolean) => void;
};

/**
 * Returns the look the system is set to, which the page is in until the top bar's switch chooses.
 *
 * @returns `dark` or `light`.
 */
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
      volume: LOUDEST_DB,
      setVolume: (volume) => set({ volume }),
      isFollowingPlayhead: true,
      setFollowingPlayhead: (isFollowingPlayhead) => set({ isFollowingPlayhead }),
    }),
    {
      name: 'chiptune.preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ isMuted, lookId, volume, isFollowingPlayhead }) => ({
        isMuted,
        lookId,
        volume,
        isFollowingPlayhead,
      }),
    },
  ),
);
