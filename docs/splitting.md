# Splitting a song

What happens to the sound when a song is cut into parts: in time (a block cut at a point) and by
channel (a track per chip channel). Found while building Split (2026-10-17); nothing here is decided
yet. Cutting in time has the bigger problems.

## Cutting in time

A song can be cut in time in two ways, and they fail differently.

- **Slicing the audio**: a block is cut into two blocks of the same clip, each trimmed to its side
  (no new clip, no render).
- **Cutting the Furnace file**: the rows before and after the cut become pieces with their own .fur,
  each rendered on its own (a new clip per piece).

### Sound that crosses the cut

Chip music rings past its notes: a note held over the bar, an instrument's release (a volume macro
that fades over a second), a long triangle or SCC note, an echo written on the same channel, a DPCM
sample still playing. At a cut all of that is cut too.

- **Rendering a piece on its own loses it at its start.** The piece's first rows are silent until
  its own first note, though in the song a note from before the cut is still sounding there.
- **And at its end.** A render stops at the piece's last row, so the release of its last notes is
  cut off (the render here runs one frame past the rows, about 20 ms; see below).
- **Slicing the audio keeps it, in place.** Both sides are slices of one recording, so a note that
  crosses the cut carries on into the second block, release and all.
- **But not once a block is moved.** A sliced block placed elsewhere starts with the tail of what
  came before it in the song, and ends with its own tail cut off where its slice ends. Repeating a
  block does the same at every repeat.

### State that crosses the cut

What the tracker has set before the cut still applies after it; a piece rendered on its own starts
from scratch.

- **Tempo**: a speed or tempo change (effects 0F, F0) earlier in the song is not in force in the
  piece, which starts at the song's first speed: the piece plays at the wrong tempo.
- **Effects still running**: vibrato, arpeggio (00), a volume slide (0A), a slide into a note (03)
  whose start pitch is from before the cut, legato.
- **Settings an effect made**: a pulse's duty (12), its sweep (13, 14), the noise mode, the
  triangle's linear counter, the DPCM's level (11), which also changes how loud the triangle and
  noise are.
- **Instruments' macros** that were half way through restart at the piece's first note, or never
  start when the piece begins mid-note.
- **Jumps and stops** (0B, 0D, FF) belong to the whole song's order; a piece has to go without them.

### Clicks

A cut that is not at a quiet point clicks, slicing or rendering alike: the wave jumps to or from
zero. A few milliseconds of fade at each cut would hide it.

### Ways out, none tried yet

- **Render a piece with the song before it.** Render from some rows before the cut (or from the
  start), then throw that part of the audio away: the piece then starts with everything that
  sounds and is set at its start, tempo included. That is what slicing the whole render gives for
  free, so it matters only where a piece needs its own .fur.
- **Carry a sounding note over.** Where a note is still sounding at a piece's first row, play it
  again there with its instrument and volume. Its sustain goes on, but it attacks again at the cut,
  which may be heard on a pulse lead.
- **Let a block's tail ring past its end.** Render on past the last row and let the tail overlap
  the next block. It doubles the sound where the next piece also holds that tail, as a slice of the
  whole render does.
- **Cut only where the music rests.** Suggest cuts where every channel is quiet (rests, the ends of
  releases), so little crosses them.

## Cutting by channel

A track per chip channel, each rendered alone over the whole song (as Split would do). Nothing in
time is cut, so nothing of a note is lost; what changes is how the channels add up.

### Measured

On a 40 s NES song made by a job (Pulse 1, Pulse 2, Triangle, Noise), each channel rendered alone with
every other channel's notes removed and every effect kept, then the renders summed and compared with
the whole render (left side of the stereo WAVs):

| Compared | Difference | Correlation |
|---|---|---|
| The same channel rendered twice | 0 % | 1.000 |
| Pulse 1 + 2 rendered together vs. alone and summed | 6 % | 0.998 |
| Triangle + noise together vs. alone and summed | 65 % | 0.808 |
| Pulses + triangle together vs. alone and summed | 60 % | 0.823 |
| All four together vs. alone and summed | 74 % | 0.739 |

- Renders are repeatable to the sample, noise included.
- By loudness the channels add up: at 22.5 s the pulses (RMS 0.100) and the triangle (0.121) make
  0.160 together, as two separate sounds should.
- The pulses' 6 % is what the NES's non-linear mixing predicts.
- **Not explained**: the large difference wherever the triangle or noise is in the mix. The NES's
  mixing does not predict that much, and the measurement may still be wrong. Whether it is heard is
  for listening: the whole render against the sum of its channels.

### What a channel rendered alone cannot keep

- **The exact mix.** The NES mixes non-linearly: its channels together are a little quieter and
  differently balanced than the sum of them alone, most where both pulses are loud; the DPCM's level
  changes how loud the triangle and noise are.
- **Song-wide effects written on another channel**: speed and tempo changes, jumps, stop. Furnace
  applies them to the whole song from whichever channel holds them, so each channel's piece must
  keep them all (the measurement above did).
- **Plain SCC** (not SCC+): channels 4 and 5 share one waveform, so one rendered alone does not get
  the other's changes. This project writes SCC+, with five separate waveforms; which chip the
  imported songs use is not checked.
- **Musical roles.** A channel with two roles (a triangle playing bass and kick) stays one track; a
  line that hops between Pulse 1 and Pulse 2 lands on two; an echo written on a second channel is a
  track of its own. The sound is all there; the tracks follow the chip's voices, not the roles.
