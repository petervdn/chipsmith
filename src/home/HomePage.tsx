// The home page: what the app is and how it works, what it needs (the programs as the server found
// them), where to start, the jobs on their way and the songs made last.
import { Plus } from 'lucide-react';
import type { Job } from '../../shared/job.schema.ts';
import { HomeLatest } from './HomeLatest.tsx';
import { HomePrograms } from './HomePrograms.tsx';
import { JobStrip } from '../jobs/JobStrip.tsx';
import { Logo } from '../top-bar/Logo.tsx';
import { README_URL, SOURCE_URL } from '../project-links.ts';
import { isJobRunning } from '../queries/jobs.ts';
import { usePageTitle } from '../use-page-title.ts';
import './HomePage.css';

const LOGO_SIZE = 96;

/** The steps from a prompt to a song, each its name and what happens in it. */
const STEPS = [
  {
    name: 'Prompt',
    text: 'On New, say what you want in words, and pick the chips, a structure and the harmony.',
  },
  {
    name: 'Style guides',
    text: 'Optionally add reusable style guides that Claude can follow: your taste, written once on Guides and chosen with a prompt.',
  },
  {
    name: 'Compose',
    text: 'Claude Code runs in the background: it writes the music as a script, checks it and builds a Furnace file (.fur) per song. Jobs shows how far it is.',
  },
  {
    name: 'Render',
    text: "Furnace's command line plays each .fur into audio, kept as FLAC beside it.",
  },
  {
    name: 'Listen and shape',
    text: "Keep, delete, prompt again or build on a song. In a song's editor, split it into its channels, ask for takes of one part, edit notes and mix the tracks.",
  },
];

/** Where to start, each a page and what it is for. */
const STARTS = [
  { href: '/songs', name: 'Songs', text: 'five example songs to listen to and take apart' },
  { href: '/new', name: 'New song', text: 'write a prompt and send it' },
  { href: '/guides', name: 'Guides', text: 'write down your taste, to send with a prompt' },
  { href: '/references', name: 'References', text: "Furnace's demo songs, channel by channel" },
];

type HomePageProps = { jobs: Job[] };

/**
 * Shows the home page.
 *
 * @param props - The component's props.
 * @param props.jobs - Every job, of which those on their way get a line.
 * @returns The page's section element.
 */
export function HomePage({ jobs }: HomePageProps) {
  usePageTitle('Home');
  return (
    <section className="home-page">
      <div className="home-page-hero">
        <Logo size={LOGO_SIZE} />
        <div>
          <h1 className="home-page-name">chipsmith</h1>
          <p className="home-page-line">
            Chiptune songs from prompts: Claude writes them, Furnace plays them, you keep what you
            like and reshape the rest.
          </p>
        </div>
      </div>
      <a className="home-page-new" href="/new">
        <Plus /> New song
      </a>
      {jobs.filter(isJobRunning).map((job) => (
        <JobStrip key={job.id} job={job} />
      ))}
      <div className="home-page-grid">
        <div>
          <h2 className="home-page-heading">What it is</h2>
          <div className="home-page-text">
            <p>
              You say what you want; Claude composes it for real sound chips (the NES, the MSX's PSG
              and Konami's SCC) and writes it as a{' '}
              <a href="https://github.com/tildearrow/furnace">Furnace</a> file, which Furnace
              renders. The songs show up here, to listen to on a phone too.
            </p>
            <p>
              A song is never final. Opened, it is an editor: tracks of blocks, each playing a clip.
              Split it into its chip channels, ask for takes of one part ("a busier bass"), move a
              note by hand. Every change is a new clip, so nothing made is lost.
            </p>
            <p>
              Claude cannot hear. What you hear is what counts: keep what works, say what does not,
              and let your style guides carry your taste into the next prompt.
            </p>
          </div>
          <h2 className="home-page-heading">How it works</h2>
          <ol className="home-page-steps">
            {STEPS.map(({ name, text }) => (
              <li key={name}>
                <strong>{name}</strong>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="home-page-heading">What it needs</h2>
          <HomePrograms />
          <h2 className="home-page-heading">Where to start</h2>
          <ul className="home-page-starts">
            {STARTS.map(({ href, name, text }) => (
              <li key={href}>
                <a href={href}>{name}</a>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <HomeLatest />
      <p className="home-page-note home-page-footer">
        Setting it up, its settings and how it is built: the <a href={README_URL}>README</a>. An
        unofficial tool: it uses Furnace's command line and is not part of the Furnace project.{' '}
        <a href={SOURCE_URL}>Source on GitHub</a>.
      </p>
    </section>
  );
}
