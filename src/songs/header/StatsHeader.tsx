// Layout 1 of a song's header: its facts as a row of tiles, then the prompt under its label with
// what it was sent with as rows under it.
import { SongPrompt } from '../SongPrompt.tsx';
import { FactList } from './FactList.tsx';
import type { SongSummary } from './song-summary.ts';
import './StatsHeader.css';

type StatsHeaderProps = { summary: SongSummary };

/**
 * Shows a song's header as tiles of facts over its prompt.
 *
 * @param props - The component's props.
 * @param props.summary - The song's prompt, facts and what the prompt was sent with.
 * @returns The header's element.
 */
export function StatsHeader({ summary }: StatsHeaderProps) {
  return (
    <div className="stats-header">
      <FactList facts={summary.facts} look="tiles" />
      <section className="stats-header-prompt">
        <h2 className="song-header-label">Prompt</h2>
        <SongPrompt prompt={summary.prompt} />
        <FactList facts={summary.promptFacts} look="rows" />
      </section>
    </div>
  );
}
