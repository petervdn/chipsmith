/**
 * Playing stretches of clips' audio with Web Audio, each scheduled on the audio clock so they stay
 * together. Audio is fetched and decoded once per clip, a few at a time; a load that hangs is given up
 * so the next play tries again. The preferences store's mute switch silences the speakers for testing
 * while everything else runs.
 */
import { getGain } from '../player/volume.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import type { Stretch } from './schedule.ts';

/** Clips decoded at the same time; more stalls phone browsers. */
const LOAD_SLOTS = 3;
/** Milliseconds before a clip's load is given up. */
const LOAD_TIMEOUT = 20000;
/** Seconds between asking to play and the first sound, for the scheduling to be ready. */
const START_DELAY = 0.06;

let context: AudioContext | null = null;
let output: GainNode | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();
let activeLoads = 0;
const waitingLoads: (() => void)[] = [];
let sources: AudioBufferSourceNode[] = [];
/** The audio clock's time at which the song's second 0 plays, while playing. */
let songZero: number | null = null;
let endTimer: ReturnType<typeof setTimeout> | null = null;
/** Counts plays, so a play that is still loading knows when it was stopped or replaced. */
let playCount = 0;

/**
 * Wakes the audio; called from a tap, as phone browsers only start audio from one. It waits at most
 * a second and a half for the audio to wake.
 */
export async function unlockAudio(): Promise<void> {
  const audio = getContext();
  if (audio.state !== 'running') {
    await Promise.race([audio.resume(), new Promise((resolve) => setTimeout(resolve, 1500))]);
  }
}

/**
 * Plays stretches from a second of the song, after stopping what plays. It loads the clips' audio
 * first, reporting how much has loaded while it waits.
 *
 * @param stretches - The stretches the song plays.
 * @param getUrl - Returns the URL of a clip's audio from its id.
 * @param from - The second of the song to play from.
 * @param end - The song's end, in seconds, at which it stops.
 * @param onProgress - Called with the share of the clips loaded, 0 to 1, as each one loads.
 * @param onEnd - Called when the song has played to its end.
 * @returns True when it started playing; false when it was stopped or replaced before it could
 * start.
 */
export async function playStretches(
  stretches: Stretch[],
  getUrl: (clipId: string) => string,
  from: number,
  end: number,
  onProgress: (fraction: number) => void,
  onEnd: () => void,
): Promise<boolean> {
  stopPlaying();
  const play = playCount;
  const urls = [...new Set(stretches.map((stretch) => getUrl(stretch.clipId)))];
  let loaded = 0;
  const decoded = new Map(
    await Promise.all(
      urls.map(async (url) => {
        const buffer = await loadAudio(url);
        if (play === playCount) onProgress(++loaded / urls.length);
        const entry: [string, AudioBuffer] = [url, buffer];
        return entry;
      }),
    ),
  );
  if (play !== playCount) return false;
  const audio = getContext();
  const zero = audio.currentTime + START_DELAY - from;
  for (const stretch of stretches) {
    const buffer = decoded.get(getUrl(stretch.clipId));
    const stretchEnd =
      stretch.start + Math.min(stretch.duration, (buffer?.duration ?? 0) - stretch.offset);
    if (!buffer || stretchEnd <= from) continue;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(getOutput());
    const skip = Math.max(0, from - stretch.start);
    source.start(
      zero + stretch.start + skip,
      stretch.offset + skip,
      stretchEnd - stretch.start - skip,
    );
    sources.push(source);
  }
  songZero = zero;
  endTimer = setTimeout(
    () => {
      stopPlaying();
      onEnd();
    },
    (end - from + START_DELAY) * 1000,
  );
  return true;
}

/** Stops what plays, and any play still loading. */
export function stopPlaying(): void {
  playCount += 1;
  if (endTimer) clearTimeout(endTimer);
  endTimer = null;
  for (const source of sources) {
    try {
      source.stop();
    } catch {
      /* a source that never started cannot be stopped */
    }
  }
  sources = [];
  songZero = null;
}

/**
 * Returns the second of the song now playing.
 *
 * @returns The second, or null when nothing plays.
 */
export function getSongPosition(): number | null {
  if (songZero === null || !context) return null;
  return Math.max(0, context.currentTime - songZero);
}

function getContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

function getOutput(): GainNode {
  if (!output) {
    output = getContext().createGain();
    const gain = output.gain;
    const { isMuted, volume } = usePreferencesStore.getState();
    gain.value = isMuted ? 0 : getGain(volume);
    usePreferencesStore.subscribe((preferences) => {
      gain.setTargetAtTime(
        preferences.isMuted ? 0 : getGain(preferences.volume),
        getContext().currentTime,
        0.02,
      );
    });
    output.connect(getContext().destination);
  }
  return output;
}

/**
 * Loads a clip's audio, decoded: fetched once, a few at a time, and given up after LOAD_TIMEOUT. A
 * load that fails is forgotten, so the next one tries again.
 *
 * @param url - The URL of the clip's audio.
 * @returns The decoded audio.
 */
export function loadAudio(url: string): Promise<AudioBuffer> {
  let buffer = buffers.get(url);
  if (!buffer) {
    buffer = takeLoadSlot(() => fetchAndDecode(url));
    buffer.catch(() => buffers.delete(url));
    buffers.set(url, buffer);
  }
  return buffer;
}

async function takeLoadSlot<Result>(load: () => Promise<Result>): Promise<Result> {
  while (activeLoads >= LOAD_SLOTS) {
    await new Promise<void>((resolve) => waitingLoads.push(resolve));
  }
  activeLoads += 1;
  try {
    return await load();
  } finally {
    activeLoads -= 1;
    waitingLoads.shift()?.();
  }
}

async function fetchAndDecode(url: string): Promise<AudioBuffer> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), LOAD_TIMEOUT);
  try {
    const response = await fetch(url, { signal: abort.signal });
    if (!response.ok) throw new Error(`${response.status} for ${url}`);
    return await getContext().decodeAudioData(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}
