// Layout 3 of a song's header: its facts as a line of pills, the prompt as a quote with a bar at its
// left, and what it was sent with as pills under it.
import { SongPrompt } from '../SongPrompt.tsx';
import { FactList } from './FactList.tsx';
import type { SongSummary } from './song-summary.ts';
import './PillsHeader.css';

type PillsHeaderProps = { summary: SongSummary };

/**
 * Shows a song's header as pills of facts and its prompt as a quote.
 *
 * @param props - The component's props.
 * @param props.summary - The song's prompt, facts and what the prompt was sent with.
 * @returns The header's element.
 */
export function PillsHeader({ summary }: PillsHeaderProps) {
  return (
    <div className="pills-header">
      <FactList facts={summary.facts} look="pills" />
      <blockquote className="pills-header-quote">
        <h2 className="song-header-label">Prompt</h2>
        <SongPrompt prompt={summary.prompt} />
        <FactList facts={summary.promptFacts} look="pills" />
      </blockquote>
    </div>
  );
}
