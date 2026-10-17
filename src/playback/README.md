# src/playback/

Playing a song in the page: what plays when, and the audio. The player's state is src/stores/player-store.ts.

- `audio-engine.ts`: stretches of clips' audio played with Web Audio, loading, muted by the preferences
- `schedule.ts`: a song's blocks as stretches of audio in seconds
- `track-taps.ts`: a tap on each track of what plays, its peak read for its meter
