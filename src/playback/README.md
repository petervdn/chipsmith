# src/playback/

Playing a song in the page: what plays when, the audio, and the one player every page shares.

- `audio-engine.ts`: stretches of clips' audio played with Web Audio, loading, and the mute switch
- `player.ts`: the one player: which song, loading or playing, where
- `schedule.ts`: a song's blocks as stretches of audio in seconds
