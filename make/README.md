# make/

Making new songs and clips on disk: ids, the clip folder with its source, script and audio, and the
song that plays it. The server reads what was made when it is asked to look again.

- `build-script.ts`: a job's script run, its songs' modules written as .fur files and plan.json
- `check-script.ts`: the quick check of a job's script: length, peak and gain of every song
- `example-script.ts`: an example of a job's script, one short NES song
- `ids.ts`: new ids for clips, songs, jobs and guides, each claimed by making its folder
- `make-song.ts`: a new song of one whole clip, made from a module
- `module-builder.ts`: a module from rows per channel, instruments, tempo and meter
- `module-facts.ts`: a module's tempo, meter and chips
- `song-plan.ts`: what a job's script gives per song, and its check
