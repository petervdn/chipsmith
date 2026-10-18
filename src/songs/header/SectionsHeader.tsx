// Layout 4 of a song's header: three sections, each under a hairline: the song's facts in columns
// (no heading, the labels say enough), and under it side by side the prompt under its heading at
// the left and what the prompt was sent with (as rows, no heading) at the right.
import { SongPrompt } from '../SongPrompt.tsx';
import { FactList } from './FactList.tsx';
import type { SongSummary } from './song-summary.ts';
import './SectionsHeader.css';

type SectionsHeaderProps = { summary: SongSummary };

/**
 * Shows a song's header as sections under headings.
 *
 * @param props - The component's props.
 * @param props.summary - The song's prompt, facts and what the prompt was sent with.
 * @returns The header's element.
 */
export function SectionsHeader({ summary }: SectionsHeaderProps) {
  return (
    <div className="sections-header">
      <section className="sections-header-section">
        <FactList facts={summary.facts} look="grid" />
      </section>
      <div className="sections-header-pair">
        <section className="sections-header-section">
          <h2 className="song-header-label">Prompt</h2>
          <SongPrompt prompt={summary.prompt} />
        </section>
        {summary.promptFacts.length > 0 && (
          <section className="sections-header-section">
            <FactList facts={summary.promptFacts} look="rows" />
          </section>
        )}
      </div>
    </div>
  );
}
