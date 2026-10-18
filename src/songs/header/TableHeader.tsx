// Layout 2 of a song's header: two columns, the prompt in a card at the left, and at the right a
// table of the song's facts and what its prompt was sent with; one column on a phone.
import { SongPrompt } from '../SongPrompt.tsx';
import { FactList } from './FactList.tsx';
import type { SongSummary } from './song-summary.ts';
import './TableHeader.css';

type TableHeaderProps = { summary: SongSummary };

/**
 * Shows a song's header as its prompt beside a table of its facts.
 *
 * @param props - The component's props.
 * @param props.summary - The song's prompt, facts and what the prompt was sent with.
 * @returns The header's element.
 */
export function TableHeader({ summary }: TableHeaderProps) {
  return (
    <div className="table-header">
      <section className="table-header-card">
        <h2 className="song-header-label">Prompt</h2>
        <SongPrompt prompt={summary.prompt} />
      </section>
      <section className="table-header-card">
        <h2 className="song-header-label">Song</h2>
        <FactList facts={summary.facts} look="rows" />
        {summary.promptFacts.length > 0 && (
          <>
            <h2 className="song-header-label table-header-sent">Sent with the prompt</h2>
            <FactList facts={summary.promptFacts} look="rows" />
          </>
        )}
      </section>
    </div>
  );
}
