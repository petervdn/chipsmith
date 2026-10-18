// A song's header, between its title and the editor: on the page, no card around it. At its top the tempo, meter and length large, the other
// facts and what the prompt was sent with (its tags too) in a grid beside them; under a hairline
// only the prompt.
import { SongPrompt } from '../SongPrompt.tsx';
import { FactList } from './FactList.tsx';
import type { SongSummary } from './song-summary.ts';
import './CardHeader.css';
import './SongHeader.css';

/** How many of the facts, from the first, are shown large. */
const LARGE_FACT_COUNT = 3;

type CardHeaderProps = { summary: SongSummary };

/**
 * Shows a song's header on the page, its main facts large.
 *
 * @param props - The component's props.
 * @param props.summary - The song's prompt, facts and what the prompt was sent with.
 * @returns The header's element.
 */
export function CardHeader({ summary }: CardHeaderProps) {
  return (
    <div className="card-header">
      <div className="card-header-top">
        <FactList facts={summary.facts.slice(0, LARGE_FACT_COUNT)} look="large" />
        <div className="card-header-rest">
          <FactList
            facts={[...summary.facts.slice(LARGE_FACT_COUNT), ...summary.promptFacts]}
            look="grid"
          />
        </div>
      </div>
      <section className="card-header-prompt">
        <h2 className="song-header-label">Prompt</h2>
        <SongPrompt prompt={summary.prompt} />
      </section>
    </div>
  );
}
