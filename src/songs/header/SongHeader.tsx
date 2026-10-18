// A song's header, between its title and the editor: two parts, each under a hairline: the song's
// facts in columns (no heading, the labels say enough), and under it side by side the prompt under
// its heading at the left and what the prompt was sent with (as rows, no heading) at the right.
import { SongPrompt } from '../SongPrompt.tsx';
import { FactList } from './FactList.tsx';
import type { SongSummary } from './song-summary.ts';
import './SongHeader.css';

type SongHeaderProps = { summary: SongSummary };

/**
 * Shows a song's header: its facts, then its prompt beside what that was sent with.
 *
 * @param props - The component's props.
 * @param props.summary - The song's prompt, facts and what the prompt was sent with.
 * @returns The header's element.
 */
export function SongHeader({ summary }: SongHeaderProps) {
  return (
    <div className="song-header">
      <section className="song-header-section">
        <FactList facts={summary.facts} look="grid" />
      </section>
      <div className="song-header-pair">
        <section className="song-header-section">
          <h2 className="song-header-label">Prompt</h2>
          <SongPrompt prompt={summary.prompt} />
        </section>
        {summary.promptFacts.length > 0 && (
          <section className="song-header-section">
            <FactList facts={summary.promptFacts} look="rows" />
          </section>
        )}
      </div>
    </div>
  );
}
