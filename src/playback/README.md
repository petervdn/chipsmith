# src/playback/

Playing a song in the page: what plays when, and the audio. The player's state is src/stores/player-store.ts.

- `audio-engine.ts`: stretches of clips' audio played with Web Audio, loading, muted by the preferences
- `metronome-clicks.ts`: where the metronome clicks: every beat, the first of a bar marked
- `metronome.ts`: the metronome's clicks scheduled on the audio clock along with the song
- `schedule.ts`: a song's blocks as stretches of audio in seconds
- `track-taps.ts`: a tap on each track of what plays: its gain (mute and solo) and its peak, for its meter
