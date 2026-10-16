# make/

Making new songs and clips on disk: ids, the clip folder with its source, script and audio, and the
song that plays it. The server reads what was made when it is asked to look again.

- `ids.ts`: new ids for clips and songs, each claimed by making its folder
- `import-archive.ts`: songs of the old batches brought in from the archive
- `make-song.ts`: a new song of one whole clip, made from a module
- `module-facts.ts`: a module's tempo, meter and chips
