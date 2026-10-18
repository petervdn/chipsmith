# More chips

A plan, not yet decided: how a prompt can name any chip Furnace has. An ADR when it is. Written
2026-10-18.

## Why a chip is "not supported" now

Furnace plays every chip it has, but chipsmith does not drive Furnace: it writes the .fur itself
(`fur/write.ts`, `make/fur-file-builder.ts`) and Furnace only renders it. To write a chip, the
project needs its Furnace id, its flags, its channels, its instrument type and what its macros mean
(`shared/chips.ts`, `fur/instrument.ts`), and the page needs its channels' names and which are not
pitched (splitting, the note grid). Only the NES, the PSG, the SCC and the SID have those.

What a prompt for another chip ("for the Mega Drive") does now, read from the code, not tried:
`ChipName` has no such chip and `CHIPS[name]` is undefined, so the script fails to build; the
composing Claude, told nothing about it, most likely writes for a chip that is there instead, and
the card does not say so.

## The plan: two tiers, and no silent stand-in

1. **Written chips.** `shared/chips.ts` becomes a table of every Furnace chip whose instruments are
   standard macros (volume, arpeggio, duty, wave, pitch) and wavetables: the Game Boy, the PC
   Engine, the VRC6, the N163, the FDS, the MMC5, the SN76489, the AY variants, the TIA, the
   WonderSwan, the Virtual Boy… Each with its id, flags, channels and unpitched channels, checked
   against Furnace's demos (`references/furnace/demos/`, one folder per system) by reading them with
   `fur/read.ts`, and by a render of a test song per chip (the pitch of A-3 measured, as for the
   PSG).
2. **Known chips.** A written chip that also has a skill (`.claude/skills/<chip>-chip/`) with its
   idioms, drums and levels, tried and heard. New offers these as switches; the prompt builder
   reads which from the table.
3. **A written chip without a skill** can be named in a typed prompt. Claude writes for it from the
   Furnace demos and what it knows, and the song is tagged as a first try on that chip, so what is
   heard can become its skill (docs/improving-songs.md).
4. **Any other chip** stops the job before it composes, with a reason on its card: the chip named,
   that it is not written yet, and which chips are. Never a stand-in chip without saying so. The
   write-song skill says the same, for a chip named in words the check cannot see.
5. **FM chips** (the YM2612 of the Mega Drive, the OPL, the OPM, the OPLL) are a step of their own:
   their instruments are operators and algorithms, an FM feature block `fur/instrument.ts` does not
   write, with their own idioms. After the macro chips, if wanted.

The SID fits this as it is: written and known, not offered on New until its late notes are found
(docs/adr/0035).

## Open

- Which chips first, and whether every macro chip goes in at once or one at a time as it is wanted.
- Where the table's facts come from: written by hand per chip, or read from Furnace's source
  (`src/engine/sysDef.cpp`) by a script.
- Whether a first-try song has a tag or a field of its own.
- A chip's order in a song (now the order of `CHIP_NAMES`) once there are many.
