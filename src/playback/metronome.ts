/**
 * The editor's metronome: a click on every beat of the song now playing, higher and louder on the
 * first beat of a bar, scheduled a little ahead on the audio clock so it stays with the song. It
 * plays through its own volume (the preferences store's) into the page's output, so the player's
 * volume and the mute switch apply to it too. When the song plays from another place, it follows.
 */
import { getGain } from '../player/volume.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { getContext, getOutput, getSongZero } from './audio-engine.ts';
import type { MetronomeTempo } from './metronome-clicks.ts';
import { getClicks } from './metronome-clicks.ts';

/** Milliseconds between looks ahead, and the seconds each look schedules ahead. */
const LOOK_INTERVAL = 25;
const LOOK_AHEAD = 0.12;
/** How long a click sounds, in seconds, and how fast its volume follows the slider. */
const CLICK_SECONDS = 0.035;
const VOLUME_EASE = 0.02;
/** A click's pitch, in hertz, and its loudness: the first beat of a bar higher and louder. */
const DOWNBEAT = { frequency: 1760, gain: 1 };
const BEAT = { frequency: 1175, gain: 0.55 };
/** How far the song's start may move, in seconds, before it counts as played from a new place. */
const MOVED = 0.001;

/**
 * Starts the metronome: from now on it clicks along with whatever song plays, until stopped.
 *
 * @param tempo - The tempo it clicks.
 * @returns A function that stops it, silencing the clicks already scheduled.
 */
export function startMetronome(tempo: MetronomeTempo): () => void {
  const audio = getContext();
  const volume = audio.createGain();
  volume.gain.value = getGain(usePreferencesStore.getState().metronomeVolume);
  volume.connect(getOutput());
  const unsubscribe = usePreferencesStore.subscribe(({ metronomeVolume }) =>
    volume.gain.setTargetAtTime(getGain(metronomeVolume), audio.currentTime, VOLUME_EASE),
  );
  let scheduled: OscillatorNode[] = [];
  let zero: number | null = null;
  let until = 0;
  /** Silences the clicks scheduled and not yet heard. */
  function silence(): void {
    for (const click of scheduled) {
      try {
        click.stop();
      } catch {
        /* a click that never started cannot be stopped */
      }
    }
    scheduled = [];
  }
  /** Schedules the clicks of the next stretch of the song, from where it was scheduled to. */
  function lookAhead(): void {
    const songZero = getSongZero();
    if (songZero === null) {
      zero = null;
      silence();
      return;
    }
    if (zero === null || Math.abs(songZero - zero) > MOVED) {
      silence();
      zero = songZero;
      until = Math.max(0, audio.currentTime - songZero);
    }
    const to = audio.currentTime - songZero + LOOK_AHEAD;
    for (const click of getClicks(until, to, tempo)) {
      const oscillator = playClick(audio, volume, songZero + click.second, click.isDownbeat);
      oscillator.addEventListener('ended', () => {
        scheduled = scheduled.filter((other) => other !== oscillator);
      });
      scheduled.push(oscillator);
    }
    until = Math.max(until, to);
  }
  const timer = setInterval(lookAhead, LOOK_INTERVAL);
  lookAhead();
  return () => {
    clearInterval(timer);
    unsubscribe();
    silence();
    volume.disconnect();
  };
}

/**
 * Plays one click: a short blip that dies away.
 *
 * @param audio - The audio context.
 * @param destination - Where the click goes: the metronome's volume.
 * @param time - When it sounds, on the audio clock.
 * @param isDownbeat - Whether it is the first beat of a bar.
 * @returns The click's oscillator, to stop it early.
 */
function playClick(
  audio: AudioContext,
  destination: AudioNode,
  time: number,
  isDownbeat: boolean,
): OscillatorNode {
  const { frequency, gain } = isDownbeat ? DOWNBEAT : BEAT;
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(gain, time);
  envelope.gain.exponentialRampToValueAtTime(gain / 1000, time + CLICK_SECONDS);
  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(time);
  oscillator.stop(time + CLICK_SECONDS);
  return oscillator;
}
