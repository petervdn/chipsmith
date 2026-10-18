# 0049. A song is exported as audio as the editor plays it, mixed in the page

- Status: accepted
- Date: 2026-10-18

## Context
A song is to be saved as an audio file. It is an arrangement of clips' audio (blocks, trims,
repeats, a level per track) that only the page's player mixes; no file of the whole song exists.
Which version is exported when there are unsaved edits, where it is mixed, and where the file goes
had to be chosen.

## Decision
- Export gives the song as the editor plays it now: the draft's tracks, saved or not, each at its
  fader; mute and solo too when some track is left unheard, which the dialog lets be switched to
  all tracks. The player's own volume is left out.
- It is mixed in the page, offline with Web Audio (`playback/mixdown.ts`), from the same stretches
  the player plays (`playback/schedule.ts`), and written as a 16-bit WAV (`playback/wav-file.ts`).
  FLAC and MP3 are that WAV encoded by the server's ffmpeg (`POST /api/encode/<type>`). The file
  types are one list (`shared/audio-export.ts`).
- Where it goes: the browser's Save dialog (`showSaveFilePicker`), asked before the mix is made as
  it opens only from a tap; where the browser has none, a download. A mix that goes over full scale
  is clipped and said so in the dialog.

## Alternatives
- **Export only the saved song.** Export would then wait on Save, and what is exported would not be
  what is heard.
- **Mix on the server with ffmpeg.** The schedule and the gains would be written a second time on
  the server and kept in step with the player's.
- **Encode FLAC and MP3 in the page.** Needs an encoder in the bundle; ffmpeg is already there.
- **A destination folder chosen in the dialog** (`showDirectoryPicker`). Its handle would have to
  be kept in IndexedDB and Chrome asks for its permission again each session; the Save dialog
  chooses the folder and the name in one step and starts in the last folder used.

## Consequences
The Save dialog exists only in desktop Chrome and Edge, and only on a secure page (localhost or
https): over the local network (`http://<address>:6502`), and on a phone, the file downloads. The
WAV goes to the server and back for FLAC and MP3 (about 10 MB a minute). Stems (a file per track)
are not offered yet.
