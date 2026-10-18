/**
 * What this browser keeps of the page's settings, in localStorage (Zustand's persist; components
 * never touch storage, docs/adr/0017): the mute switch for testing, the look the page is in
 * (looks.ts), the player's volume, whether the editor follows the playhead, how wide its track
 * names are and how tall its tracks, its metronome (on or off, and its volume), and whether it shows a song's structure and the
 * mixer.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { TRACK_HEIGHT } from '../editor/track-height.ts';
import { TRACK_NAME_WIDTH } from '../editor/track-name-width.ts';
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
  /** How wide the editor's track names are drawn, in pixels (editor/track-name-width.ts). */
  trackNameWidth: number;
  /** How tall the editor's track rows are drawn, in pixels (editor/track-height.ts). */
  trackHeight: number;
  /** Whether the editor's metronome clicks while its song plays. */
  isMetronomeOn: boolean;
  /** The metronome's volume, in decibels (player/volume.ts), up to well above the music's. */
  metronomeVolume: number;
  /** Whether the editor shows the structure a song was asked for above its tracks. */
  isStructureShown: boolean;
  /** Whether the editor's mixer is open under its timeline. */
  isMixerOpen: boolean;
  setMuted: (isMuted: boolean) => void;
  setLookId: (lookId: string) => void;
  setVolume: (volume: number) => void;
  setFollowingPlayhead: (isFollowingPlayhead: boolean) => void;
  setTrackNameWidth: (trackNameWidth: number) => void;
  setTrackHeight: (trackHeight: number) => void;
  setMetronomeOn: (isMetronomeOn: boolean) => void;
  setMetronomeVolume: (metronomeVolume: number) => void;
  setStructureShown: (isStructureShown: boolean) => void;
  setMixerOpen: (isMixerOpen: boolean) => void;
  /** Puts every preference back as a first visit has it. */
  reset: () => void;
};

/** The preferences kept, without the actions. */
type Preferences = Omit<PreferencesStore, `set${string}` | 'reset'>;

/** The metronome's volume to start with, in decibels: as loud as the music. */
const METRONOME_DB = 0;

/**
 * Returns the look the system is set to, which the page is in until the top bar's switch chooses.
 *
 * @returns `dark` or `light`.
 */
function getSystemLookId(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Returns the preferences as a first visit has them.
 *
 * @returns Every preference at its default; the look the system's.
 */
function getDefaultPreferences(): Preferences {
  return {
    isMuted: false,
    lookId: getSystemLookId(),
    volume: LOUDEST_DB,
    isFollowingPlayhead: true,
    trackNameWidth: TRACK_NAME_WIDTH,
    trackHeight: TRACK_HEIGHT,
    isMetronomeOn: false,
    metronomeVolume: METRONOME_DB,
    isStructureShown: true,
    isMixerOpen: false,
  };
}

/** The preferences store. */
export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...getDefaultPreferences(),
      setMuted: (isMuted) => set({ isMuted }),
      setLookId: (lookId) => set({ lookId }),
      setVolume: (volume) => set({ volume }),
      setFollowingPlayhead: (isFollowingPlayhead) => set({ isFollowingPlayhead }),
      setTrackNameWidth: (trackNameWidth) => set({ trackNameWidth }),
      setTrackHeight: (trackHeight) => set({ trackHeight }),
      setMetronomeOn: (isMetronomeOn) => set({ isMetronomeOn }),
      setMetronomeVolume: (metronomeVolume) => set({ metronomeVolume }),
      setStructureShown: (isStructureShown) => set({ isStructureShown }),
      setMixerOpen: (isMixerOpen) => set({ isMixerOpen }),
      reset: () => set(getDefaultPreferences()),
    }),
    {
      name: 'chiptune.preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        isMuted,
        lookId,
        volume,
        isFollowingPlayhead,
        trackNameWidth,
        trackHeight,
        isMetronomeOn,
        metronomeVolume,
        isStructureShown,
        isMixerOpen,
      }) => ({
        isMuted,
        lookId,
        volume,
        isFollowingPlayhead,
        trackNameWidth,
        trackHeight,
        isMetronomeOn,
        metronomeVolume,
        isStructureShown,
        isMixerOpen,
      }),
    },
  ),
);
