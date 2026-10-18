/**
 * Playing stretches of clips' audio with Web Audio, each scheduled on the audio clock so they stay
 * together; with a loop, each pass is scheduled while the one before plays, so they join without a
 * gap (loop.ts). Audio is fetched and decoded once per clip, a few at a time; a load that hangs is given up
 * so the next play tries again. Each track plays through a tap of its own (track-taps.ts), for its
 * meter. The preferences store's mute switch silences the speakers for testing while everything else
 * runs, the meters too.
 */
import { getGain } from '../player/volume.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import type { Loop } from './loop.ts';
import { getLoopPass, getLoopedSecond } from './loop.ts';
import type { Piece, Stretch } from './schedule.ts';
import { getFittedStretches, getPieces } from './schedule.ts';
import { clearTrackTaps, getTrackInput } from './track-taps.ts';

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
/**
 * The audio clock's time at which the play's clock is at 0, while playing: the time the song's second
 * 0 plays on its first pass. With a loop, the play's clock runs on past the loop's end.
 */
let songZero: number | null = null;
/** The loop playing, or null. */
let playingLoop: Loop | null = null;
/** The timer that stops the song at its end, or schedules a loop's next pass. */
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
 * Plays stretches from a second of the song, after stopping what plays: to the song's end, or round
 * a loop until stopped. It loads the clips' audio first, reporting how much has loaded while it
 * waits.
 *
 * @param stretches - The stretches the song plays.
 * @param getUrl - Returns the URL of a clip's audio from its id.
 * @param from - The second of the song to play from; with a loop, before its end.
 * @param end - The song's end, in seconds, at which it stops when there is no loop.
 * @param loop - The loop to play round, or null to play to the end.
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
  loop: Loop | null,
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
  const fitted = getFittedStretches(stretches, (clipId) => decoded.get(getUrl(clipId))?.duration);
  function playPieces(pieces: Piece[]): void {
    for (const piece of pieces) {
      const buffer = decoded.get(getUrl(piece.clipId));
      if (!buffer) continue;
      const source = audio.createBufferSource();
      source.buffer = buffer;
      source.connect(getTrackInput(audio, piece.trackId, getOutput()));
      source.start(zero + piece.at, piece.offset, piece.duration);
      source.addEventListener('ended', () => {
        sources = sources.filter((other) => other !== source);
      });
      sources.push(source);
    }
  }
  songZero = zero;
  playingLoop = loop;
  if (!loop) {
    playPieces(getPieces(fitted, from, end, 0));
    endTimer = setTimeout(
      () => {
        stopPlaying();
        onEnd();
      },
      (end - from + START_DELAY) * 1000,
    );
    return true;
  }
  playPieces(getPieces(fitted, from, loop.end, 0));
  /**
   * Schedules a pass of the loop, and the timer that schedules the one after it once this one
   * starts, so one pass is always scheduled ahead.
   *
   * @param pass - The pass, 1 for the first after the first.
   */
  function playPass(pass: number): void {
    if (!loop) return;
    const { at, shift } = getLoopPass(loop, pass);
    playPieces(getPieces(fitted, loop.start, loop.end, shift));
    endTimer = setTimeout(() => playPass(pass + 1), (zero + at - audio.currentTime) * 1000);
  }
  playPass(1);
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
  clearTrackTaps();
  songZero = null;
  playingLoop = null;
}

/**
 * Returns the second of the song now playing: round a loop, the place in it.
 *
 * @returns The second, or null when nothing plays.
 */
export function getSongPosition(): number | null {
  if (songZero === null || !context) return null;
  return getLoopedSecond(Math.max(0, context.currentTime - songZero), playingLoop);
}

/**
 * Returns when the song now playing started, on the audio clock.
 *
 * @returns The audio clock's time of the song's second 0 on its first pass (it may lie before the
 *   second played from; round a loop, the play's clock runs on from it), or null when nothing plays.
 */
export function getSongZero(): number | null {
  return songZero;
}

/**
 * Returns the page's audio context, made the first time it is asked for.
 *
 * @returns The audio context.
 */
export function getContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

/**
 * Returns where everything the page plays goes: through the player's volume and the mute switch to
 * the speakers.
 *
 * @returns The output's gain node.
 */
export function getOutput(): GainNode {
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
