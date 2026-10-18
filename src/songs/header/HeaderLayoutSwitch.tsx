// Prev and next through the layouts of a song's header, with which one is shown ("layout 2 of 5:
// table"), to compare them. It knows nothing of the layouts but their names.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './HeaderLayoutSwitch.css';

type HeaderLayoutSwitchProps = {
  names: string[];
  index: number;
  onChange: (index: number) => void;
};

/**
 * Shows prev and next through the header's layouts, and the one shown.
 *
 * @param props - The component's props.
 * @param props.names - The layouts' names, in order.
 * @param props.index - The layout shown.
 * @param props.onChange - Called with the layout to show; round from the last to the first.
 * @returns The switch's element.
 */
export function HeaderLayoutSwitch({ names, index, onChange }: HeaderLayoutSwitchProps) {
  const count = names.length;
  return (
    <div className="header-layout-switch" role="group" aria-label="header layout">
      <button
        type="button"
        onClick={() => onChange((index - 1 + count) % count)}
        aria-label="previous layout"
        data-tooltip="previous layout"
      >
        <ChevronLeft />
      </button>
      <span className="header-layout-switch-name">
        layout {index + 1} of {count}: {names[index]}
      </span>
      <button
        type="button"
        onClick={() => onChange((index + 1) % count)}
        aria-label="next layout"
        data-tooltip="next layout"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
