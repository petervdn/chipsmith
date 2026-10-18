# make/

Making new songs and clips on disk: ids, the clip folder with its source, script and audio, and the
song that plays it. The server reads what was made when it is asked to look again.

- `build-script.ts`: a job's script run, its songs written as .fur files and plan.json
- `check-script.ts`: the quick check of a job's script: length, peak and gain of every song, and with `--takes-of` whether each take fits its clip
- `example-script.ts`: an example of a job's script, one short NES song
- `fur-file-builder.ts`: a song's .fur contents from rows per channel, instruments, tempo and meter
- `fur-file-facts.ts`: what a .fur file says of its music, a clip's facts: tempo, meter, chips, channels, length
- `ids.ts`: new ids for clips, songs, jobs and guides, each claimed by making its folder
- `make-song.ts`: a new song of one whole clip, made from a .fur file
- `make-take.ts`: a take of a clip, a variation with its label, made from a .fur file
- `notes-take.ts`: a clip's notes for the note grid, and a take made from them once edited
- `transpose-take.ts`: a take of a clip transposed, without Claude, labelled by how far
- `take-check.ts`: whether a take fits its clip: the same chips and tempo, notes to play
- `song-titles.ts`: the words each song's title is asked to have, and the titles already taken
- `song-plan.ts`: what a job's script gives per song, and its check
- `split-song.ts`: a whole song split into a clip per channel, each alone on a track
