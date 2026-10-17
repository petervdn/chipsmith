// A clip's waveform, or a slice of it, drawn on a canvas in the text colour of where it sits; drawn
// again when the look changes.
import { useEffect, useRef } from 'react';
import { useClipPeaks } from '../queries/peaks.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { PEAKS_PER_SECOND } from './clip-peaks.ts';
import './Waveform.css';

/** The widest canvas drawn, in device pixels; a wider block stretches it. */
const MOST_PIXELS = 8192;

type WaveformProps = { clipId: string; offset: number; duration: number; width: number };

/**
 * Shows a slice of a clip's waveform on a canvas, in the text colour of where it sits; drawn again
 * when the look changes.
 *
 * @param props - The component's props.
 * @param props.clipId - The id of the clip.
 * @param props.offset - Where in the clip the slice starts, in seconds.
 * @param props.duration - How long the slice is, in seconds.
 * @param props.width - How wide it is drawn, in pixels.
 * @returns The waveform's canvas element.
 */
export function Waveform({ clipId, offset, duration, width }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: peaks } = useClipPeaks(clipId);
  const lookId = usePreferencesStore((state) => state.lookId);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    drawPeaks(canvas, peaks, { offset, duration, width });
  }, [peaks, offset, duration, width, lookId]);
  return <canvas ref={canvasRef} className="waveform" style={{ width }} aria-hidden="true" />;
}

function drawPeaks(
  canvas: HTMLCanvasElement,
  peaks: number[],
  { offset, duration, width }: { offset: number; duration: number; width: number },
): void {
  const ratio = window.devicePixelRatio || 1;
  const pixels = Math.max(1, Math.min(MOST_PIXELS, Math.round(width * ratio)));
  const height = Math.round(canvas.clientHeight * ratio) || 1;
  canvas.width = pixels;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, pixels, height);
  context.fillStyle = getComputedStyle(canvas).color;
  const first = offset * PEAKS_PER_SECOND;
  const perPixel = (duration * PEAKS_PER_SECOND) / pixels;
  for (let x = 0; x < pixels; x++) {
    let peak = 0;
    const from = Math.floor(first + x * perPixel);
    const to = Math.max(from + 1, Math.floor(first + (x + 1) * perPixel));
    for (let i = from; i < to; i++) peak = Math.max(peak, peaks[i] ?? 0);
    const bar = Math.max(1, peak * height);
    context.fillRect(x, (height - bar) / 2, 1, bar);
  }
}
