# src/playback/

Playing a song in the page: what plays when, and the audio. The player's state is src/stores/player-store.ts.

- `audio-engine.ts`: stretches of clips' audio played with Web Audio, round a loop too, loading, muted by the preferences
- `chord-voicing.ts`: a chord as notes to play: its bass and its tones, in a key
- `loop.ts`: a loop's passes on one clock, and the place in the loop a second has come round to
- `metronome-clicks.ts`: where the metronome clicks: every beat, the first of a bar marked
- `metronome.ts`: the metronome's clicks scheduled on the audio clock along with the song
- `mixdown.ts`: a song's stretches mixed down offline to one piece of audio, each track at its gain
- `progression-preview.ts`: a progression heard before it is kept, on chip-like sounds
- `schedule.ts`: a song's blocks as stretches of audio in seconds, and the pieces of them between two seconds
- `track-taps.ts`: a tap on each track of what plays: its gain (mute and solo) and its peak, for its meter
- `wav-file.ts`: a mix written as a 16-bit WAV, and its peak
