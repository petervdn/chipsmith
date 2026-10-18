# To try later

Ideas set aside on purpose, with what is known so far. Not plans: each needs the user's go before work
resumes.

## A headless Furnace build for rendering

Rendering starts the Furnace app for every file (`/Applications/Furnace.app/Contents/MacOS/Furnace
-output`), which opens a CoreMIDI client and fails after many quick launches; for now a pause between
renders and retries cover it (render/furnace.ts). Found on 2026-10-17:
- Furnace's source (v0.6.8.3, the installed version) builds without its GUI, SDL and RtMidi:
  `cmake -S . -B build-headless -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_GUI=OFF -DUSE_RTMIDI=OFF
  -DUSE_SDL2=OFF -DWITH_PORTAUDIO=OFF -DWITH_JACK=OFF -DSYSTEM_ZLIB=ON` (the vendored zlib does not
  compile against the current macOS SDK). It is built in `../chiptune-furnace/build-headless/furnace`.
- Its renders equal the app's byte for byte except on the NES noise channel, where hits, timing and
  level match but the noise samples differ. Not yet listened to: does it sound the same?

## A base recorded as the song's state at the time

"Use as base" puts a song's id in the prompt's text (`[s0042]`); the composing Claude reads the song
as it is when the job runs. If a song is changed later (the editor), a prompt sent again builds on its
new state. If that ever matters: record the base song's arrangement at the time of the prompt on the
job and its songs (clips never change, so that pins the music exactly). Set aside 2026-10-17 as not
needed yet.

## A step's tokens that add up to the job's

A step's tokens are estimated (Claude Code's guess for thinking, characters / 4 for text and tool
calls) and come to 65-81% of the exact total at the top of a job's card, as code and JSON hold more
tokens per character. The log gives each message's exact output tokens when it ends: they could be
shared out over that message's steps by their estimates. To find out first: whether that count comes
before or after the lines the steps are read from. Set aside 2026-10-17.

## "Prompt again" keeps the song count

"Prompt again" starts the count at 1, whatever the prompt was sent with. The count is on the job, not
the song, so the song would need to know its job or the count. Set aside 2026-10-17.

## The stages row going back to Writing

The stages row only moves forward, as do the stage lines in the steps: when Claude changes the script
after a check, it still shows Checking. It could show Writing again. Set aside 2026-10-17.

## One job per song, the songs of a prompt a set

Each song its own Claude run in turn, so its stages are the song's and a failure or a stop costs one
song; each later one told the songs made before it (title, tempo, meter, key, groove), to differ
from them. Weighed against: more tokens (1.3-1.5× by the jobs so far, from two jobs of three songs),
and the variety one Claude gets by writing the songs of a set together. Undecided; an ADR when it is.
Set aside 2026-10-17.

## What a clip's prompt is for

Every clip keeps `prompt` (with `guides` and `promptId`) so it can be read alone (0004). So far it is
only ever a copy of its song's: a new song's whole clip has the song's prompt, and a split clip copies
its parent's, though no prompt made it (its `parent`, `split`, says what did). It is shown in the
block's details and on the Clips page, and read by one rule, a song "changed after its prompt"
(`server/api.ts`), a comparison of the two texts that cannot be true until variations exist (still
to build 1). Ways it could go:

- **As it is.** Cheap, but it means "the prompt the music goes back to", not "the prompt that made
  this clip".
- **Only the prompt that made the clip**: a whole clip the song's, a split clip none, a variation
  its change ("make the B bass busier"). "Changed after its prompt" becomes a `variation` among a
  song's clips' parents, not a comparison of texts. Leaning this way; it changes 0004 for split
  clips, and the split clips made so far lose their prompt.
- **None on clips; the song holds it.** Only if clips belong to one song (still to build 3); a
  variation's prompt would then need a record of its own.

Undecided; an ADR when it is. Set aside 2026-10-18.
