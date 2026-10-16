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
