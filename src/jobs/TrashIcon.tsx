// A small trash can drawn in the text colour, for removing jobs from the list.

/**
 * Draws a trash can.
 *
 * @returns The trash can's svg element.
 */
export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.2a1 1 0 0 0 1 .8h4.6a1 1 0 0 0 1-.8L12 4M6.75 6.5v5M9.25 6.5v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
