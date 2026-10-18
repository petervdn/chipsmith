// A song's header on its page, between its title and the editor: its facts, its prompt and what the
// prompt was sent with, in one of five layouts to compare (prev and next in the page's head). The
// layouts not chosen are deleted once one is.
import type { ComponentType } from 'react';
import { CardHeader } from './CardHeader.tsx';
import { PillsHeader } from './PillsHeader.tsx';
import { SectionsHeader } from './SectionsHeader.tsx';
import { StatsHeader } from './StatsHeader.tsx';
import type { SongSummary } from './song-summary.ts';
import { TableHeader } from './TableHeader.tsx';
import './SongHeader.css';

/** A layout of the header: its name, and the component that draws it. */
type SongHeaderLayout = { name: string; Layout: ComponentType<{ summary: SongSummary }> };

/** The layouts to compare, in the order prev and next step through them. */
export const SONG_HEADER_LAYOUTS: SongHeaderLayout[] = [
  { name: 'tiles', Layout: StatsHeader },
  { name: 'table', Layout: TableHeader },
  { name: 'pills', Layout: PillsHeader },
  { name: 'sections', Layout: SectionsHeader },
  { name: 'card', Layout: CardHeader },
];

type SongHeaderProps = { summary: SongSummary; layoutIndex: number };

/**
 * Shows a song's header in the layout chosen.
 *
 * @param props - The component's props.
 * @param props.summary - The song's prompt, facts and what the prompt was sent with.
 * @param props.layoutIndex - Which of the layouts to draw it in.
 * @returns The header's element.
 */
export function SongHeader({ summary, layoutIndex }: SongHeaderProps) {
  const Layout = SONG_HEADER_LAYOUTS[layoutIndex]?.Layout ?? StatsHeader;
  return <Layout summary={summary} />;
}
