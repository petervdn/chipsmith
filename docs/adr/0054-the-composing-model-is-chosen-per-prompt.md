# 0054. The model that composes is chosen per prompt

- Status: superseded by 0055
- Date: 2026-10-22

## Context
A job's time is almost all Claude's own writing: in the jobs of 2026-10-20 and 21, about 98% of a
job was the Claude run, two thirds of its output thinking, and building and rendering about 3 s.
Every job ran on Claude Code's default model (Opus at the time). A faster model makes a job
faster; whether its songs are as good is for listening.

## Decision
- Under Create on New, a switch of the models to compose with: Opus (at first), Sonnet, Haiku
  (`shared/composer-models.ts`, aliases Claude Code's `--model` reads, each the latest of its
  kind). Like New's other choices it starts afresh on every visit (0052).
- The job keeps the model (`model` in job.json; null for a job from before, which ran on the
  default), and its card shows it. The runner starts Claude with `--model` (`claude-run.ts`).
- Takes of a clip are composed by Opus; their prompt has no switch yet.

## Alternatives
- **One model for every job, in the settings.** No choice to make per prompt, but comparing the
  models means changing a setting and restarting between prompts.
- **A lower effort instead of another model.** Claude Code's `--effort` cuts the thinking too;
  it may be worth a switch of its own once the models are compared.

## Consequences
The model is kept on the job, not on the songs it made: to know which model made a song, its job
is the record.
