/**
 * A progression heard before it is kept: its chords played on chip-like sounds with Web Audio, a
 * triangle bass on every beat and the chord on squares, broken up (an arpeggio in eighths) or all
 * its notes at once (held for the chord's length), at a fixed tempo, once round (twice when it is
 * short). It plays into the page's output, so the player's volume and the mute switch
 * apply to it.
 */
import type { Chord } from '../../shared/harmony.schema.ts';
import { getContext, getOutput } from './audio-engine.ts';
import { getVoicing } from './chord-voicing.ts';

/** How a progression's chords are heard: broken up into an arpeggio, or all their notes at once. */
export type PreviewStyle = 'broken' | 'together';

/** The preview's tempo, its beats in a bar, and the arpeggio's notes in a beat. */
const PREVIEW_BPM = 112;
const BEATS_PER_BAR = 4;
const NOTES_PER_BEAT = 2;
/** A progression this short, in bars, or shorter is played twice round. */
const SHORT_BARS = 4;
/** Seconds before the first note, for the scheduling to be ready. */
const START_DELAY = 0.05;
/** How loud the bass and the arpeggio are, and how much of its step a note sounds. */
const BASS_GAIN = 0.32;
const ARPEGGIO_GAIN = 0.07;
const CHORD_TONE_GAIN = 0.045;
const NOTE_LENGTH = 0.8;
/** The seconds in a minute, the MIDI note of A 440 Hz, and the notes in an octave. */
const MINUTE = 60;
const A440 = 69;
const A440_HZ = 440;
const OCTAVE = 12;
/** How fast a note dies away: the share of its loudness left at its end. */
const DECAY = 0.05;

/**
 * Plays a progression in a key.
 *
 * @param chords - The chords.
 * @param note - The key's note.
 * @param style - How its chords are heard: broken up, or all their notes at once.
 * @param onEnd - Called when it has played to its end (not when stopped).
 * @returns A function that stops it.
 */
export function playProgression(
  chords: Chord[],
  note: string,
  style: PreviewStyle,
  onEnd: () => void,
): () => void {
  const audio = getContext();
  const output = getOutput();
  const beatSeconds = MINUTE / PREVIEW_BPM;
  const bars = chords.reduce((sum, chord) => sum + chord.bars, 0);
  const rounds = bars <= SHORT_BARS ? 2 : 1;
  const oscillators: OscillatorNode[] = [];
  let time = audio.currentTime + START_DELAY;
  for (let round = 0; round < rounds; round += 1) {
    for (const chord of chords) {
      const voicing = getVoicing(chord.numeral, note);
      const beats = chord.bars * BEATS_PER_BAR;
      if (voicing) {
        const arpeggio = [...voicing.tones, (voicing.tones[0] ?? voicing.bass) + OCTAVE];
        for (let beat = 0; beat < beats; beat += 1) {
          const at = time + beat * beatSeconds;
          oscillators.push(
            playNote(audio, output, {
              midi: voicing.bass,
              at,
              seconds: beatSeconds * NOTE_LENGTH,
              type: 'triangle',
              gain: BASS_GAIN,
            }),
          );
          for (let step = 0; style === 'broken' && step < NOTES_PER_BEAT; step += 1) {
            const index = (beat * NOTES_PER_BEAT + step) % arpeggio.length;
            const stepSeconds = beatSeconds / NOTES_PER_BEAT;
            oscillators.push(
              playNote(audio, output, {
                midi: arpeggio[index] ?? voicing.bass,
                at: at + step * stepSeconds,
                seconds: stepSeconds * NOTE_LENGTH,
                type: 'square',
                gain: ARPEGGIO_GAIN,
              }),
            );
          }
        }
        for (const tone of style === 'together' ? voicing.tones : []) {
          oscillators.push(
            playNote(audio, output, {
              midi: tone,
              at: time,
              seconds: beats * beatSeconds * NOTE_LENGTH,
              type: 'square',
              gain: CHORD_TONE_GAIN,
            }),
          );
        }
      }
      time += beats * beatSeconds;
    }
  }
  const timer = setTimeout(onEnd, (time - audio.currentTime) * 1000);
  return () => {
    clearTimeout(timer);
    for (const oscillator of oscillators) {
      try {
        oscillator.stop();
      } catch {
        /* a note that never started cannot be stopped */
      }
    }
  };
}

/**
 * Plays one note that dies away.
 *
 * @param audio - The audio context.
 * @param destination - Where it goes.
 * @param note - The note.
 * @param note.midi - Its pitch, as a MIDI note number.
 * @param note.at - When it starts, on the audio clock.
 * @param note.seconds - How long it sounds.
 * @param note.type - Its wave.
 * @param note.gain - How loud it starts.
 * @returns Its oscillator, to stop it early.
 */
function playNote(
  audio: AudioContext,
  destination: AudioNode,
  {
    midi,
    at,
    seconds,
    type,
    gain,
  }: { midi: number; at: number; seconds: number; type: OscillatorType; gain: number },
): OscillatorNode {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = A440_HZ * 2 ** ((midi - A440) / OCTAVE);
  envelope.gain.setValueAtTime(gain, at);
  envelope.gain.exponentialRampToValueAtTime(gain * DECAY, at + seconds);
  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(at);
  oscillator.stop(at + seconds);
  return oscillator;
}
