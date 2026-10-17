// The trail at the head of a page, from the list it belongs to down to the page itself ("Songs ›
// Seven Teeth"); its last crumb is the page's heading.
import './Breadcrumbs.css';

/** A crumb: its text, and where it leads (none for the page itself). */
export type Crumb = { label: string; href?: string };

type BreadcrumbsProps = { crumbs: Crumb[] };

/**
 * Shows the breadcrumbs of a page.
 *
 * @param props - The component's props.
 * @param props.crumbs - The crumbs, from the outermost to the page itself.
 * @returns The breadcrumbs' nav element.
 */
export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="where you are">
      {crumbs.map((crumb, i) =>
        i < crumbs.length - 1 ? (
          <span key={crumb.label} className="breadcrumbs-step">
            {crumb.href ? (
              <a className="breadcrumbs-link" href={crumb.href}>
                {crumb.label}
              </a>
            ) : (
              <span className="breadcrumbs-link">{crumb.label}</span>
            )}
            <span className="breadcrumbs-mark" aria-hidden="true">
              ›
            </span>
          </span>
        ) : (
          <h1 key={crumb.label} className="breadcrumbs-current">
            {crumb.label}
          </h1>
        ),
      )}
    </nav>
  );
}
